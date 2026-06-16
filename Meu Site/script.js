// ============ AUTENTICAÇÃO ============
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');

// Elementos de toggle
const toggleLogin = document.getElementById('toggleLogin');
const toggleSignup = document.getElementById('toggleSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Login
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

// Signup
const signupUsername = document.getElementById('signupUsername');
const signupPassword = document.getElementById('signupPassword');
const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');
const signupBtn = document.getElementById('signupBtn');
const signupMessage = document.getElementById('signupMessage');

// Header
const userName = document.getElementById('userName');
const changeUsernameBtn = document.getElementById('changeUsernameBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;

// Verificar se usuário já está logado
window.addEventListener('DOMContentLoaded', () => {
    const sessionToken = sessionStorage.getItem('currentUser');
    if (sessionToken) {
        currentUser = JSON.parse(sessionToken);
        showAppScreen();
    } else {
        showAuthScreen();
    }
    
    initializeAuthEvents();
    if (currentUser) {
        initializeListApp();
    }
});

function initializeAuthEvents() {
    // Toggle entre Login e Cadastro
    toggleLogin.addEventListener('click', showLoginForm);
    toggleSignup.addEventListener('click', showSignupForm);
    
    // Login
    loginBtn.addEventListener('click', handleLogin);
    loginUsername.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginPassword.focus();
    });
    loginPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Signup
    signupBtn.addEventListener('click', handleSignup);
    signupUsername.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') signupPassword.focus();
    });
    signupPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') signupPasswordConfirm.focus();
    });
    signupPasswordConfirm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSignup();
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    changeUsernameBtn.addEventListener('click', handleChangeUsername);
    changePasswordBtn.addEventListener('click', handleChangePassword);
}

function showLoginForm() {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    toggleLogin.classList.add('active');
    toggleSignup.classList.remove('active');
    clearAuthMessages();
}

function showSignupForm() {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    toggleSignup.classList.add('active');
    toggleLogin.classList.remove('active');
    clearAuthMessages();
}

function clearAuthMessages() {
    loginMessage.textContent = '';
    signupMessage.textContent = '';
}

function handleChangeUsername() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const oldUsername = currentUser.username;
    const newUsernameRaw = prompt('Digite seu novo nome de usuário:', oldUsername);
    if (!newUsernameRaw) {
        return;
    }

    const newUsername = newUsernameRaw.trim();
    if (newUsername.length < 3) {
        alert('O nome de usuário deve ter pelo menos 3 caracteres.');
        return;
    }

    if (newUsername === oldUsername) {
        alert('Você já está usando este nome de usuário.');
        return;
    }

    if (users[newUsername]) {
        alert('Este nome de usuário já está em uso. Escolha outro.');
        return;
    }

    const userData = users[oldUsername];
    if (!userData) {
        alert('Usuário atual não encontrado. Faça login novamente.');
        return;
    }

    // Atualiza chave do usuário
    delete users[oldUsername];
    users[newUsername] = {
        ...userData,
        username: newUsername
    };
    localStorage.setItem('users', JSON.stringify(users));

    // Atualiza itens do usuário
    const oldItems = JSON.parse(localStorage.getItem(`items_${oldUsername}`)) || [];
    localStorage.setItem(`items_${newUsername}`, JSON.stringify(oldItems));
    localStorage.removeItem(`items_${oldUsername}`);

    currentUser.username = newUsername;
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    userName.textContent = newUsername;

    alert('Nome de usuário alterado com sucesso!');
}

async function handleChangePassword() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const username = currentUser.username;
    const userData = users[username];
    if (!userData) {
        alert('Usuário atual não encontrado. Faça login novamente.');
        return;
    }

    const currentPassword = prompt('Digite sua senha atual:');
    if (!currentPassword) {
        return;
    }

    const currentPasswordHash = await hashPassword(currentPassword);
    if (currentPasswordHash !== userData.passwordHash) {
        alert('Senha atual incorreta. Tente novamente.');
        return;
    }

    const newPassword = prompt('Digite a nova senha:');
    if (!newPassword) {
        return;
    }

    if (newPassword.length < 6) {
        alert('A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }

    const confirmPassword = prompt('Confirme a nova senha:');
    if (newPassword !== confirmPassword) {
        alert('As senhas não coincidem. Tente novamente.');
        return;
    }

    users[username].passwordHash = await hashPassword(newPassword);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Senha alterada com sucesso!');
}

async function handleLogin() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {
        showLoginMessage('Preencha todos os campos!', 'error');
        return;
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Recuperar usuários do localStorage
    const users = JSON.parse(localStorage.getItem('users')) || {};

    // Verificar se usuário existe
    if (!users[username]) {
        showLoginMessage('Usuário não encontrado. Crie uma conta!', 'error');
        return;
    }

    // Verificar se senha está correta
    if (users[username].passwordHash !== passwordHash) {
        showLoginMessage('Senha incorreta!', 'error');
        return;
    }

    // Login bem-sucedido — entrar diretamente
    currentUser = { username: username };
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAppScreen();
}

async function handleSignup() {
    const username = signupUsername.value.trim();
    const password = signupPassword.value;
    const passwordConfirm = signupPasswordConfirm.value;

    // Validações
    if (!username || !password || !passwordConfirm) {
        showSignupMessage('Preencha todos os campos!', 'error');
        return;
    }

    if (username.length < 3) {
        showSignupMessage('Nome de usuário deve ter pelo menos 3 caracteres!', 'error');
        return;
    }

    if (password.length < 6) {
        showSignupMessage('Senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showSignupMessage('As senhas não combinam!', 'error');
        return;
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Recuperar usuários do localStorage
    let users = JSON.parse(localStorage.getItem('users')) || {};

    // Verificar se usuário já existe
    if (users[username]) {
        showSignupMessage('Este usuário já está registrado. Tente fazer login!', 'error');
        return;
    }

    // Criar novo usuário
    users[username] = {
        username: username,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
    };
    localStorage.setItem('users', JSON.stringify(users));

    // Criar pasta de itens para este usuário
    localStorage.setItem(`items_${username}`, JSON.stringify([]));

    // Login automático (sem verificação para novo cadastro)
    currentUser = { username: username };
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

    showSignupMessage('Conta criada com sucesso! 🎉', 'success');
    setTimeout(showAppScreen, 800);
}

async function hashPassword(password) {
    // Usar SubtleCrypto para fazer hash seguro
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// ============ LISTA DE ITENS ============
function initializeListApp() {
    const itemInput = document.getElementById('itemInput');
    const addBtn = document.getElementById('addBtn');
    const itemList = document.getElementById('itemList');
    const clearBtn = document.getElementById('clearBtn');
    const itemCount = document.getElementById('itemCount');

    // Carregar itens do usuário atual
    let items = JSON.parse(localStorage.getItem(`items_${currentUser.username}`)) || [];

    renderList();

    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addItem();
        }
    });

    addBtn.addEventListener('click', addItem);

    clearBtn.addEventListener('click', () => {
        if (items.length > 0 && confirm('Tem certeza que quer remover todos os itens?')) {
            items = [];
            saveToLocalStorage();
            renderList();
        }
    });

    function addItem() {
        const text = itemInput.value.trim();
        
        if (text === '') {
            alert('Digite algo antes de adicionar!');
            itemInput.focus();
            return;
        }

        const item = {
            id: Date.now(),
            text: text,
            date: new Date().toLocaleString('pt-BR')
        };

        items.push(item);
        saveToLocalStorage();
        renderList();

        itemInput.value = '';
        itemInput.focus();
    }

    function removeItem(id) {
        items = items.filter(item => item.id !== id);
        saveToLocalStorage();
        renderList();
    }

    function renderList() {
        if (items.length === 0) {
            itemList.innerHTML = '<p class="empty-message">Nenhum item ainda. Digite algo acima!</p>';
            itemCount.textContent = '0 itens';
            return;
        }

        itemList.innerHTML = items.map(item => `
            <div class="list-item">
                <div class="item-content">
                    <p class="item-text">${escapeHtml(item.text)}</p>
                    <p class="item-date">${item.date}</p>
                </div>
                <button class="btn-remove" onclick="window.removeItemHandler(${item.id})" title="Remover">
                    ✕
                </button>
            </div>
        `).join('');

        const pluralItem = items.length === 1 ? 'item' : 'itens';
        itemCount.textContent = `${items.length} ${pluralItem}`;
    }

    function saveToLocalStorage() {
        localStorage.setItem(`items_${currentUser.username}`, JSON.stringify(items));
    }

    window.removeItemHandler = function(id) {
        removeItem(id);
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

function handleLogout() {
    if (confirm('Tem certeza que quer sair?')) {
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        loginUsername.value = '';
        loginPassword.value = '';
        signupUsername.value = '';
        signupPassword.value = '';
        signupPasswordConfirm.value = '';
        clearAuthMessages();
        showLoginForm(); // Volta para login por padrão
        showAuthScreen();
    }
}

function showAuthScreen() {
    authScreen.classList.add('active');
    appScreen.classList.remove('active');
}

function showAppScreen() {
    authScreen.classList.remove('active');
    appScreen.classList.add('active');
    userName.textContent = currentUser.username;
    initializeListApp();
}

function showLoginMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `auth-message auth-message-${type}`;
}

function showSignupMessage(message, type) {
    signupMessage.textContent = message;
    signupMessage.className = `auth-message auth-message-${type}`;
}

async function hashPassword(password) {
    // Usar SubtleCrypto para fazer hash seguro
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
