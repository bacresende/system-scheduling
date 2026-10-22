function sessionTokenFor(user) {
  const token = user.getSessionToken();
  if (!token) throw new Error('O Parse não retornou um token de sessão.');
  return token;
}

async function sessionFor(user) {
  const adminRoleQuery = new Parse.Query(Parse.Role);
  adminRoleQuery.equalTo('name', 'ADMIN');
  adminRoleQuery.equalTo('users', user);
  const adminRole = await adminRoleQuery.first({ useMasterKey: true });

  const session = {
    id: user.id,
    nome: user.get('nome'),
    papel: adminRole ? 'ADMIN' : 'CLIENTE',
  };

  if (adminRole) return session;

  const clientQuery = new Parse.Query('Cliente');
  clientQuery.equalTo('usuario', user);
  clientQuery.include('endereco');
  const client = await clientQuery.first({ useMasterKey: true });

  if (!client) return session;

  const address = client.get('endereco');
  session.cliente = {
    id: client.id,
    nome: user.get('nome'),
    email: user.get('email'),
    telefone: user.get('telefone'),
    nasc: client.get('nasc'),
    cpf: client.get('cpf'),
    cadastroCompleto: Boolean(client.get('cadastroCompleto')),
    ...(address
      ? {
          endereco: {
            cep: address.get('cep'),
            logradouro: address.get('logradouro'),
            numeroResidencia: address.get('numeroResidencia'),
            bairro: address.get('bairro'),
            complemento: address.get('complemento'),
            cidade: address.get('cidade'),
            estado: address.get('estado'),
            pais: address.get('pais'),
          },
        }
      : {}),
  };

  return session;
}

Parse.Cloud.define('preCadastro', async (request) => {
  const { nome, email, telefone, senha } = request.params;

  if (
    typeof nome !== 'string' ||
    typeof email !== 'string' ||
    typeof telefone !== 'string' ||
    typeof senha !== 'string'
  ) {
    throw new Error('Informe nome, e-mail, telefone e senha.');
  }

  const normalizedName = nome.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = telefone.trim();

  if (!normalizedName || !normalizedEmail || !normalizedPhone || !senha) {
    throw new Error('Todos os campos do cadastro são obrigatórios.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Informe um e-mail válido.');
  }
  if (!/^\+?[1-9]\d{9,14}$/.test(normalizedPhone)) {
    throw new Error('Informe um telefone válido.');
  }

  const clientRoleQuery = new Parse.Query(Parse.Role);
  clientRoleQuery.equalTo('name', 'CLIENTE');
  const clientRole = await clientRoleQuery.first({ useMasterKey: true });
  if (!clientRole) throw new Error('Crie o papel CLIENTE no Back4App antes de cadastrar usuários.');

  const user = new Parse.User();
  user.set('username', normalizedEmail);
  user.set('email', normalizedEmail);
  user.set('password', senha);
  user.set('nome', normalizedName);
  user.set('telefone', normalizedPhone);

  const registeredUser = await user.signUp();
  clientRole.getUsers().add(registeredUser);
  await clientRole.save(null, { useMasterKey: true });

  return {
    sessionToken: sessionTokenFor(registeredUser),
    session: await sessionFor(registeredUser),
  };
});

Parse.Cloud.define('login', async (request) => {
  const { email, senha } = request.params;
  if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
    throw new Error('Informe e-mail e senha.');
  }

  const user = await Parse.User.logIn(email.trim().toLowerCase(), senha);
  return {
    sessionToken: sessionTokenFor(user),
    session: await sessionFor(user),
  };
});

Parse.Cloud.define('sessao', async (request) => {
  if (!request.user) throw new Error('É necessário estar autenticado.');
  return sessionFor(request.user);
});
