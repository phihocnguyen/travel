INSERT INTO roles(id,name) VALUES('user','User') ON CONFLICT(id) DO NOTHING;
INSERT INTO user_roles(user_id,role_id)
SELECT id,'user' FROM users WHERE NOT EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id=users.id)
ON CONFLICT DO NOTHING;
