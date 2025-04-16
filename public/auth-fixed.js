// Arquivo específico para corrigir problemas de autenticação e botões administrativos
document.addEventListener('DOMContentLoaded', function() {
    console.log("🛡️ Carregando sistema de autenticação fixo...");
    
    // Verificar se o usuário está autenticado no carregamento da página
    checkAuthStatus();
    
    // Adicionar eventos de login e logout
    setupLoginSystem();
    
    console.log("🔒 Sistema de autenticação fixo inicializado");
});

// Verificar o status de autenticação ao carregar a página
function checkAuthStatus() {
    console.log("🔍 Verificando status de autenticação...");
    
    const userData = localStorage.getItem('escalasUserData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user && user.isAdmin) {
                console.log("✅ Usuário autenticado:", user);
                showAdminButtons(true);
                updateLoginButton(true);
                return true;
            }
        } catch (e) {
            console.error('❌ Erro ao processar dados de autenticação:', e);
            localStorage.removeItem('escalasUserData');
        }
    }
    
    console.log("❌ Usuário não autenticado");
    showAdminButtons(false);
    updateLoginButton(false);
    return false;
}

// Configurar sistema de login
function setupLoginSystem() {
    console.log("🔧 Configurando sistema de login...");
    
    // Configurar botão de login na barra superior
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = function() {
            const userData = localStorage.getItem('escalasUserData');
            if (userData) {
                // Se já estiver logado, fazer logout
                doLogout();
            } else {
                // Se não estiver logado, mostrar modal de login
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'flex';
                    console.log("🔓 Modal de login aberto");
                }
            }
        };
    }
    
    // Configurar botão de submit no modal de login
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    if (loginSubmitBtn) {
        loginSubmitBtn.onclick = async function() {
            console.log("🔑 Tentando fazer login...");
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginModal = document.getElementById('loginModal');
            const loginError = document.getElementById('loginError');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                if (!response.ok) {
                    throw new Error('Credenciais inválidas');
                }
                
                // Login bem-sucedido
                const userData = await response.json();
                localStorage.setItem('escalasUserData', JSON.stringify(userData));
                
                // Fechar o modal de login
                if (loginModal) {
                    loginModal.style.display = 'none';
                }
                
                console.log("✅ Login bem-sucedido! Exibindo botões de administrador...");
                
                // Exibir botões de administrador e atualizar o botão de login
                showAdminButtons(true);
                updateLoginButton(true);
                
            } catch (error) {
                console.error('❌ Erro no login:', error);
                
                // Mostrar erro no modal
                if (loginError) {
                    loginError.style.display = 'block';
                    loginError.textContent = 'Usuário ou senha incorretos.';
                    setTimeout(() => {
                        loginError.style.display = 'none';
                    }, 3000);
                }
            }
        };
    }
    
    // Configurar fechamento do modal de login
    const closeLoginBtn = document.querySelector('#loginModal .close-btn');
    if (closeLoginBtn) {
        closeLoginBtn.onclick = function() {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
        };
    }
}

// Função para fazer logout
async function doLogout() {
    console.log("🚪 Iniciando logout...");
    
    try {
        // Imediatamente ocultar botões administrativos
        showAdminButtons(false);
        updateLoginButton(false);
        
        // Chamar a API de logout
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao fazer logout da API');
        }
        
        // Remover dados do localStorage
        localStorage.removeItem('escalasUserData');
        
        // Confirmar para o usuário
        alert('Logout realizado com sucesso!');
        console.log("✅ Logout completo");
        
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        
        // Remover dados do localStorage de qualquer forma
        localStorage.removeItem('escalasUserData');
        
        // Recarregar a página para garantir que tudo seja resetado
        window.location.reload();
    }
}

// Mostrar ou ocultar botões administrativos
function showAdminButtons(show) {
    console.log(show ? "🔓 Exibindo botões administrativos" : "🔒 Ocultando botões administrativos");
    
    const adminButtonsContainer = document.getElementById('adminButtonsContainer');
    if (adminButtonsContainer) {
        adminButtonsContainer.style.display = show ? 'flex' : 'none';
    } else {
        console.error("❌ Contêiner de botões administrativos não encontrado!");
    }
}

// Atualizar botão de login/logout
function updateLoginButton(isLoggedIn) {
    console.log(isLoggedIn ? "🔓 Atualizando botão para 'Sair'" : "🔒 Atualizando botão para 'Área Administrativa'");
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        if (isLoggedIn) {
            loginBtn.innerHTML = '<span class="login-icon">🔓</span><span>Sair</span>';
        } else {
            loginBtn.innerHTML = '<span class="login-icon">🔒</span><span>Área Administrativa</span>';
        }
    } else {
        console.error("❌ Botão de login não encontrado!");
    }
}