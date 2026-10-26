function sessionTokenFor(user) {
  const token = user.getSessionToken();
  if (!token) throw new Error('O Parse não retornou um token de sessão.');
  return token;
}

function valueFor(record, key) {
  if (!record) return undefined;
  return typeof record.get === 'function' ? record.get(key) : record[key];
}

function serializeDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

async function serializeAddress(address) {
  if (!address) return undefined;
  if (typeof address.fetch === 'function' && !address.get('cep')) {
    await address.fetch({ useMasterKey: true });
  }
  const result = {
    cep: valueFor(address, 'cep'),
    logradouro: valueFor(address, 'logradouro'),
    numeroResidencia: valueFor(address, 'numeroResidencia'),
    bairro: valueFor(address, 'bairro'),
    complemento: valueFor(address, 'complemento'),
    cidade: valueFor(address, 'cidade'),
    estado: valueFor(address, 'estado'),
    pais: valueFor(address, 'pais'),
  };
  return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== undefined));
}

async function sessionFor(user) {
  const adminRoleQuery = new Parse.Query(Parse.Role);
  adminRoleQuery.equalTo('name', 'ADMIN');
  adminRoleQuery.equalTo('users', user);
  const adminRole = await adminRoleQuery.first({ useMasterKey: true });

  let client;
  if (!adminRole) {
    const clientQuery = new Parse.Query('Cliente');
    clientQuery.equalTo('usuario', user);
    clientQuery.include('endereco');
    client = await clientQuery.first({ useMasterKey: true });
  }

  const clientAddress = client ? await serializeAddress(client.get('endereco')) : undefined;
  const session = {
    id: user.id,
    nome: user.get('nome'),
    email: user.get('email'),
    telefone: user.get('telefone'),
    cpf: user.get('cpf') ?? (client && client.get('cpf')),
    nasc: serializeDate(user.get('nasc') ?? (client && client.get('nasc'))),
    endereco: (await serializeAddress(user.get('endereco'))) ?? clientAddress,
    ocupacaoProfissional: user.get('ocupacaoProfissional'),
    cadastroCompleto: Boolean(
      user.get('cadastroCompleto') ?? (client && client.get('cadastroCompleto')),
    ),
    perfil: adminRole ? 'ADMIN' : 'CLIENTE',
  };

  return Object.fromEntries(Object.entries(session).filter(([, value]) => value !== undefined));
}

function isValidCpf(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const size of [9, 10]) {
    let sum = 0;
    for (let index = 0; index < size; index++) {
      sum += Number(cpf[index]) * (size + 1 - index);
    }
    if (((sum * 10) % 11) % 10 !== Number(cpf[size])) return false;
  }
  return true;
}

function profileError(message) {
  return new Parse.Error(Parse.Error.VALIDATION_ERROR, message);
}

function normalizeAddress(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw profileError('Informe um endereço válido.');
  }

  const requiredFields = [
    'cep',
    'logradouro',
    'numeroResidencia',
    'bairro',
    'cidade',
    'estado',
    'pais',
  ];
  const address = {};
  for (const field of requiredFields) {
    const entry = value[field];
    if (typeof entry !== 'string' || !entry.trim()) {
      throw profileError('Preencha todos os campos obrigatórios do endereço.');
    }
    address[field] = entry.trim();
  }

  if (address.cep.length > 20) {
    throw profileError('O CEP deve ter até 20 caracteres.');
  }
  if (!/^[A-Za-z]{2}$/.test(address.estado)) {
    throw profileError('Informe uma UF válida com 2 letras.');
  }
  address.estado = address.estado.toUpperCase();

  const complemento = value.complemento;
  if (complemento !== undefined && typeof complemento !== 'string') {
    throw profileError('Informe um complemento válido.');
  }
  if (typeof complemento === 'string' && complemento.trim()) {
    address.complemento = complemento.trim();
  }
  return address;
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
    ...await sessionFor(registeredUser),
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
    ...await sessionFor(user),
  };
});

Parse.Cloud.define('sessao', async (request) => {
  if (!request.user) throw new Error('É necessário estar autenticado.');
  return sessionFor(request.user);
});

Parse.Cloud.define('consultarCep', async (request) => {
  if (!request.user) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'É necessário entrar.');
  }

  const cep = typeof request.params.cep === 'string' ? request.params.cep.replace(/\D/g, '') : '';
  if (!/^\d{8}$/.test(cep)) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, 'Informe um CEP válido com 8 dígitos.');
  }

  let response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
    });
  } catch {
    throw new Parse.Error(
      Parse.Error.INTERNAL_SERVER_ERROR,
      'Não foi possível consultar o serviço de CEP. Tente novamente.',
    );
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Parse.Error(
      Parse.Error.INTERNAL_SERVER_ERROR,
      'O serviço de CEP está indisponível no momento. Tente novamente.',
    );
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Parse.Error(
      Parse.Error.INTERNAL_SERVER_ERROR,
      'O serviço de CEP retornou uma resposta inválida.',
    );
  }
  if (
    typeof result !== 'object' ||
    result === null ||
    result.erro === true ||
    typeof result.logradouro !== 'string' ||
    typeof result.bairro !== 'string' ||
    typeof result.localidade !== 'string' ||
    typeof result.uf !== 'string'
  ) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'CEP não encontrado.');
  }

  return {
    cep,
    logradouro: result.logradouro,
    complemento: typeof result.complemento === 'string' ? result.complemento : '',
    bairro: result.bairro,
    cidade: result.localidade,
    estado: result.uf,
  };
});

Parse.Cloud.define('completarCadastro', async (request) => {
  if (!request.user) throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'É necessário entrar.');

  const { cpf, nasc, endereco, ocupacaoProfissional } = request.params;
  if (typeof cpf !== 'string' || !isValidCpf(cpf)) {
    throw profileError('Informe um CPF válido.');
  }
  if (
    typeof nasc !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(nasc) ||
    !Number.isFinite(Date.parse(`${nasc}T00:00:00.000Z`)) ||
    new Date(`${nasc}T00:00:00.000Z`).toISOString().slice(0, 10) !== nasc ||
    nasc > new Date().toISOString().slice(0, 10)
  ) {
    throw profileError('Informe uma data de nascimento válida.');
  }
  if (
    ocupacaoProfissional !== undefined &&
    (typeof ocupacaoProfissional !== 'string' || ocupacaoProfissional.trim().length > 120)
  ) {
    throw profileError('A ocupação profissional deve ter até 120 caracteres.');
  }

  const normalizedAddress = normalizeAddress(endereco);
  const user = request.user;
  user.set('cpf', cpf);
  user.set('nasc', new Date(`${nasc}T00:00:00.000Z`));
  const Endereco = Parse.Object.extend('Endereco');
  const address = user.get('endereco') || new Endereco();
  for (const [field, value] of Object.entries(normalizedAddress)) {
    address.set(field, value);
  }
  await address.save(null, { useMasterKey: true });
  user.set('endereco', address);
  if (typeof ocupacaoProfissional === 'string' && ocupacaoProfissional.trim()) {
    user.set('ocupacaoProfissional', ocupacaoProfissional.trim());
  } else {
    user.unset('ocupacaoProfissional');
  }
  user.set('cadastroCompleto', true);
  await user.save(null, { useMasterKey: true });

  const adminRoleQuery = new Parse.Query(Parse.Role);
  adminRoleQuery.equalTo('name', 'ADMIN');
  adminRoleQuery.equalTo('users', user);
  const isAdmin = Boolean(await adminRoleQuery.first({ useMasterKey: true }));
  if (!isAdmin) {
    const clientQuery = new Parse.Query('Cliente');
    clientQuery.equalTo('usuario', user);
    const client = await clientQuery.first({ useMasterKey: true });
    if (client) {
      client.set('cpf', cpf);
      client.set('nasc', new Date(`${nasc}T00:00:00.000Z`));
      client.set('cadastroCompleto', true);
      const address = client.get('endereco');
      if (address && typeof address.set === 'function') {
        for (const [field, value] of Object.entries(normalizedAddress)) {
          address.set(field, value);
        }
        await address.save(null, { useMasterKey: true });
      }
      await client.save(null, { useMasterKey: true });
    }
  }

  const session = await sessionFor(user);
  session.nasc = nasc;
  session.endereco = normalizedAddress;
  return session;
});
