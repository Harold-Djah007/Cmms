import re
from dataclasses import replace
from backend.app import accounts
from contextlib import closing

from backend.app.accounts import bootstrap_owner
from backend.app.config import settings
from backend.app.database import connect, transaction
from backend.tests.test_api import client_for
from backend.tests.test_validation import valid_state


class Relay:
    messages = []
    fail = False
    def __init__(self, *args, **kwargs): pass
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def starttls(self, **kwargs): pass
    def login(self, *args): pass
    def send_message(self, message):
        if self.fail: raise OSError('offline')
        self.messages.append(message)
        return {}


def setup(client, monkeypatch):
    assert client.put('/api/v1/state', json={'revision': 0, 'state': valid_state()}).status_code == 200
    configured = replace(settings, auth_mode='password', owner_emails=('owner@example.com',), smtp_host='mail.test', public_url='http://testserver', smtp_username='')
    for module in ('accounts', 'security', 'main'):
        monkeypatch.setattr('backend.app.'+module+'.settings', configured)
    Relay.messages = []
    Relay.fail = False
    monkeypatch.setattr('backend.app.accounts.smtplib.SMTP', Relay)
    bootstrap_owner('owner@example.com', 'Owner', 'Owner secure password!')
    assert client.post('/api/auth/login', json={'email':'owner@example.com','password':'Owner secure password!'}).status_code == 200


def token():
    return re.search(r'#(?:invite|reset)=([\w-]+)', Relay.messages[-1].get_content()).group(1)


def invitation(client, **kwargs):
    return client.post('/api/auth/invitations', json={'name':'Technician','email':'tech@plant.org','roleId':'R1','accessKind':'mobile', **kwargs})


def test_invitation_accept_login_reset_and_session_revocation(tmp_path, monkeypatch):
    with client_for(tmp_path) as client:
        setup(client, monkeypatch)
        assert invitation(client).status_code == 200
        raw = token()
        assert raw not in client.get('/api/auth/invitations').text
        payload = {'token':raw, 'password':'Technician secure password!'}
        assert client.post('/api/auth/redeem/invite', json=payload).status_code == 200
        assert client.post('/api/auth/redeem/invite', json=payload).status_code == 400
        user = client.get('/api/v1/state').json()['state']['users'][-1]
        assert user['accessKind'] == 'mobile' and user['active']
        login = {'email':'tech@plant.org', 'password':payload['password'], 'accessKind':'web'}
        assert client.post('/api/auth/login', json=login).status_code == 403
        login['accessKind'] = 'mobile'
        response = client.post('/api/auth/login', json=login)
        assert response.status_code == 200 and 'HttpOnly' in response.headers['set-cookie']
        assert client.get('/api/v1/session').json()['identity']['email'] == 'tech@plant.org'
        assert client.post('/api/auth/forgot', json={'email':'tech@plant.org'}).status_code == 200
        reset = token()
        assert client.post('/api/auth/redeem/reset', json={'token':reset,'password':'A new secure password!'}).status_code == 200
        assert client.get('/api/v1/session').status_code == 401
        assert client.post('/api/auth/login', json=login).status_code == 401
        login['password'] = 'A new secure password!'
        assert client.post('/api/auth/login', json=login).status_code == 200
        assert client.post('/api/auth/logout').status_code == 200
        assert client.get('/api/v1/session').status_code == 401
        assert client.get('/', follow_redirects=False).status_code == 303


def test_failed_revoked_expired_and_replaced_invites(tmp_path, monkeypatch):
    with client_for(tmp_path) as client:
        setup(client, monkeypatch)
        Relay.fail = True
        assert invitation(client).status_code == 502
        assert client.get('/api/auth/invitations').json()[0]['status'] == 'Failed'
        Relay.fail = False
        assert invitation(client).status_code == 200
        first = token()
        assert invitation(client).status_code == 200
        second = token()
        assert client.post('/api/auth/redeem/invite', json={'token':first,'password':'Secure password 123'}).status_code == 400
        current = next(r for r in client.get('/api/auth/invitations').json() if r['status'] == 'Sent')
        assert client.delete('/api/auth/invitations/'+current['id']).status_code == 200
        assert client.post('/api/auth/redeem/invite', json={'token':second,'password':'Secure password 123'}).status_code == 400
        assert invitation(client).status_code == 200
        third = token()
        with transaction() as db: db.execute('UPDATE account_tokens SET expires=0')
        assert client.post('/api/auth/redeem/invite', json={'token':third,'password':'Secure password 123'}).status_code == 400


def test_no_fake_delivery_and_login_throttling(tmp_path, monkeypatch):
    with client_for(tmp_path) as client:
        setup(client, monkeypatch)
        monkeypatch.setattr(accounts, 'settings', replace(accounts.settings, smtp_host=''))
        assert invitation(client).status_code == 503
        assert client.post('/api/auth/forgot', json={'email':'owner@example.com'}).status_code == 503
        for _ in range(10):
            result = client.post('/api/auth/login', json={'email':'nobody@plant.org','password':'Incorrect password'})
            assert result.status_code == 401
        assert client.post('/api/auth/login', json={'email':'nobody@plant.org','password':'Incorrect password'}).status_code == 429
