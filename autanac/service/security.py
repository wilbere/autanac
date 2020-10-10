# -*- coding: utf-8 -*-

import autanac
import autanac.exceptions

def login(db, login, password):
    res_users = autanac.registry(db)['res.users']
    try:
        return res_users._login(db, login, password)
    except autanac.exceptions.AccessDenied:
        return False

def check(db, uid, passwd):
    res_users = autanac.registry(db)['res.users']
    return res_users.check(db, uid, passwd)

def compute_session_token(session, env):
    self = env['res.users'].browse(session.uid)
    return self._compute_session_token(session.sid)

def check_session(session, env):
    self = env['res.users'].browse(session.uid)
    expected = self._compute_session_token(session.sid)
    if expected and autanac.tools.misc.consteq(expected, session.session_token):
        return True
    self._invalidate_session_cache()
    return False
