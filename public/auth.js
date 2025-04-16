// Sistema de autenticação independente
// Este arquivo deve ser incluído antes de qualquer outro script
console.log("Sistema de autenticação carregado!");

// Criar modal de login automaticamente
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando sistema de autenticação...");
    criarModalLogin();
    setupAdminButton();
    
    // Bloquear funções de edição de equipes por segurança
    window.toggleEditMode = function() {
        console.warn("Funcionalidade de edição de equipes desativada");
        return false;
    };
    
    window.addMilitaryToTeam = function() {
        console.warn("Funcionalidade de adição de militares às equipes desativada");
        return false;
    };
    
    window.initTeamEditor = function() {
        console.warn("Editor de equipes desativado");
        return false;
    };
});

function criarModalLogin() {
    // Verificar se o modal já existe
    if (document.getElementById('loginModal')) {
        return;
    }
    
    // Criar o modal
    const modalHtml = `
        <div id="loginModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Área Administrativa</h2>
                    <button id="closeLoginModal" class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="loginForm">
                        <div class="form-group">
                            <label for="username">Usuário:</label>
                            <input type="text" id="username" placeholder="Digite seu usuário" value="admin">
                        </div>
                        <div class="form-group">
                            <label for="password">Senha:</label>
                            <input type="password" id="password" placeholder="Digite sua senha" value="admin123">
                        </div>
                        <div id="loginError" style="color: red; margin-top: 10px; display: none;">
                            Usuário ou senha incorretos!
                        </div>
                        <div class="form-buttons">
                            <button id="submitLoginBtn" type="button">Entrar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar o modal ao corpo da página
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    // Configurar os eventos do modal
    const modal = document.getElementById('loginModal');
    const closeBtn = document.getElementById('closeLoginModal');
    const submitBtn = document.getElementById('submitLoginBtn');
    
    closeBtn.addEventListener('click', function() {
        modal.classList.remove('active');
    });
    
    submitBtn.addEventListener('click', fazerLogin);

    // Adicione evento para a tecla Enter no campo de senha
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            fazerLogin();
        }
    });
}

async function fazerLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const userData = await response.json();
            
            // Salvar no localStorage
            localStorage.setItem('escalasUserData', JSON.stringify(userData));
            
            // Fechar o modal
            document.getElementById('loginModal').classList.remove('active');
            
            // Atualizar a UI para o estado autenticado
            atualizarInterfaceAutenticada();
            
            // Exibir mensagem de sucesso
            alert('Login realizado com sucesso!');
            
            // Recarregar a página para aplicar as permissões
            window.location.reload();
        } else {
            // Mostrar erro
            document.getElementById('loginError').textContent = 'Usuário ou senha incorretos';
            document.getElementById('loginError').style.display = 'block';
            setTimeout(() => {
                document.getElementById('loginError').style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        document.getElementById('loginError').textContent = 'Erro ao conectar com o servidor';
        document.getElementById('loginError').style.display = 'block';
    }
}

// Função mantida para compatibilidade com código existente, mas não é mais usada diretamente
function validarCredenciais(username, password) {
    // Credenciais fixas para o administrador
    return (username === 'admin' && password === 'admin123');
}

async function logout() {
    try {
        // Ocultar IMEDIATAMENTE o contêiner de botões administrativos
        console.log("🔒 Iniciando logout, ocultando botões administrativos IMEDIATAMENTE...");
        
        // Remover atributo de autenticação do body
        document.body.removeAttribute('data-auth');
        
        // Ocultar contêiner de botões administrativos
        const adminButtonsContainer = document.getElementById('adminButtonsContainer');
        if (adminButtonsContainer) {
            adminButtonsContainer.style.display = 'none';
            console.log("✅ Contentor de botões administrativos ocultado com sucesso");
        }
        
        // Atualizar botão de login imediatamente 
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="login-icon">🔒</span><span>Área Administrativa</span>';
            loginBtn.onclick = function() {
                document.getElementById('loginModal').classList.add('active');
            };
            console.log("✅ Botão de login atualizado para 'Área Administrativa'");
        }
        
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
        
        console.log("✅ Logout completo, interface atualizada");
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        
        // Remover dados do localStorage de qualquer forma
        localStorage.removeItem('escalasUserData');
        
        // Recarregar a página para garantir que tudo seja resetado
        window.location.reload();
    }
}

function verificarAutenticacao() {
    console.log("Verificando autenticação...");
    const userData = localStorage.getItem('escalasUserData');
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user && user.isAdmin) {
                console.log("Usuário autenticado:", user);
                atualizarInterfaceAutenticada();
                return true;
            }
        } catch (e) {
            console.error('Erro ao processar dados de autenticação:', e);
            localStorage.removeItem('escalasUserData');
        }
    }
    
    console.log("Usuário não autenticado");
    atualizarInterfaceNaoAutenticada();
    return false;
}

function atualizarInterfaceAutenticada() {
    console.log("🔐 Atualizando interface para usuário autenticado");
    
    // Mostrar o contentor de botões administrativos
    const adminButtonsContainer = document.getElementById('adminButtonsContainer');
    if (adminButtonsContainer) {
        adminButtonsContainer.style.display = 'flex';
        console.log("✅ Contentor de botões administrativos exibido com sucesso");
    } else {
        console.error("⚠️ Contentor de botões administrativos não encontrado");
    }
    
    // Atualizar botão de login para "Sair"
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.innerHTML = '<span class="login-icon">🔓</span><span>Sair</span>';
        loginBtn.onclick = logout; // Usar onclick em vez de addEventListener
        console.log("✅ Botão de login atualizado para 'Sair' com função de logout");
    } else {
        console.error("⚠️ Botão de login não encontrado");
    }
    
    // Adicionar um atributo ao body para saber que estamos autenticados
    document.body.setAttribute('data-auth', 'true');
    console.log("✅ Atributo data-auth adicionado ao body");
}

function atualizarInterfaceNaoAutenticada() {
    console.log("Atualizando interface para usuário não autenticado");
    
    // Ocultar elementos administrativos
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Ocultar a área administrativa
    const adminButtons = document.querySelector('.admin-buttons');
    if (adminButtons) {
        adminButtons.style.display = 'none';
    }
    
    // Atualizar botão para "Área Administrativa"
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.innerHTML = '<span class="login-icon">🔒</span><span>Área Administrativa</span>';
        
        // Remover todos os event listeners existentes
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        
        // Adicionar novo event listener para mostrar o modal de login
        newLoginBtn.addEventListener('click', function() {
            document.getElementById('loginModal').classList.add('active');
        });
    }
}

function setupAdminButton() {
    console.log("Configurando botão admin...");
    
    // Procurar pelo botão de login existente - ID correto é loginBtn
    const loginBtn = document.getElementById('loginBtn');
    
    if (loginBtn) {
        console.log("Botão admin encontrado, configurando eventos");
        
        // Verificar se o usuário já está autenticado
        if (verificarAutenticacao()) {
            // Já está configurado pela função verificarAutenticacao
        } else {
            // Limpar eventos existentes para evitar conflitos
            const newLoginBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
            
            // Configurar para abrir o modal de login
            newLoginBtn.addEventListener('click', function() {
                console.log("Clique no botão de login");
                document.getElementById('loginModal').classList.add('active');
            });
        }
    } else {
        console.log("Botão admin não encontrado, aguardando carregamento da página");
        
        // Tentar novamente após um curto intervalo (para garantir que o DOM esteja carregado)
        setTimeout(setupAdminButton, 500);
    }
}