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
                        <div class="admin-reset" style="margin-top: 20px; text-align: center; font-size: 0.8em;">
                            <a href="#" id="resetAdminBtn" style="color: #555; text-decoration: underline;">Resetar usuário admin (emergência)</a>
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
    
    // Configurar o botão de reset do admin
    const resetAdminBtn = document.getElementById('resetAdminBtn');
    if (resetAdminBtn) {
        resetAdminBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (confirm('ATENÇÃO: Você está prestes a resetar o usuário administrador.\n\nEsta ação irá restaurar as credenciais padrão:\n- Usuário: admin\n- Senha: admin123\n\nDeseja continuar?')) {
                try {
                    // Mostrar feedback
                    resetAdminBtn.textContent = 'Processando...';
                    resetAdminBtn.style.color = '#888';
                    
                    // Chamar o endpoint de reset
                    const response = await fetch('/api/reset-admin');
                    
                    if (response.ok) {
                        const result = await response.json();
                        
                        // Exibir informação de sucesso
                        document.getElementById('loginError').textContent = '✅ Admin resetado com sucesso!';
                        document.getElementById('loginError').style.color = 'green';
                        document.getElementById('loginError').style.display = 'block';
                        
                        // Restaurar valores padrão nos campos
                        document.getElementById('username').value = 'admin';
                        document.getElementById('password').value = 'admin123';
                        
                        // Restaurar botão de reset
                        setTimeout(() => {
                            resetAdminBtn.textContent = 'Resetar usuário admin (emergência)';
                            resetAdminBtn.style.color = '#555';
                        }, 2000);
                    } else {
                        throw new Error('Falha ao resetar admin');
                    }
                } catch (error) {
                    console.error('Erro ao resetar admin:', error);
                    
                    // Mostrar erro
                    document.getElementById('loginError').textContent = 'Erro ao resetar admin: ' + error.message;
                    document.getElementById('loginError').style.color = 'red';
                    document.getElementById('loginError').style.display = 'block';
                    
                    // Restaurar botão
                    resetAdminBtn.textContent = 'Resetar usuário admin (emergência)';
                    resetAdminBtn.style.color = '#555';
                }
            }
        });
    }
}

async function fazerLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Mostrar feedback ao usuário
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('submitLoginBtn').textContent = 'Autenticando...';
    
    try {
        // Sempre tentar autenticar via API, sem verificar localmente
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        // Restaurar botão
        document.getElementById('submitLoginBtn').textContent = 'Entrar';
        
        if (response.ok) {
            const userData = await response.json();
            
            // Salvar no localStorage
            localStorage.setItem('escalasUserData', JSON.stringify(userData));
            
            // Fechar o modal
            const loginModal = document.getElementById('loginModal');
            if (loginModal.classList.contains('active')) {
                loginModal.classList.remove('active');
            } else {
                loginModal.style.display = 'none';
            }
            
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

// Função mantida para compatibilidade com código existente, mas sempre retorna true
// para forçar a tentativa de login via API (mais seguro e funciona em todos os ambientes)
function validarCredenciais(username, password) {
    // Sempre tentar autenticar via servidor
    return true;
}

async function logout() {
    try {
        // Ocultar IMEDIATAMENTE o contêiner de botões administrativos
        console.log("🔒 Iniciando logout, ocultando botões administrativos IMEDIATAMENTE...");
        
        // Remover atributo de autenticação do body
        document.body.removeAttribute('data-auth');
        
        // SOLUÇÃO DIRETA: Ocultar explicitamente os botões administrativos
        document.getElementById('adminButtonsContainer').style.display = 'none';
        document.getElementById('addEventBtn').style.display = 'none';
        document.getElementById('resetBtn').style.display = 'none';
        console.log("✅ Botões administrativos ocultados com sucesso");
        
        // Atualizar botão de login imediatamente 
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerHTML = '<span class="login-icon">🔒</span><span>Área Administrativa</span>';
            loginBtn.onclick = function() {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'flex';
                }
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
        // Não mostrar mensagem de logout
        
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
    
    // Mostrar também os botões administrativos individualmente
    const addEventBtn = document.getElementById('addEventBtn');
    if (addEventBtn) {
        addEventBtn.style.display = 'inline-flex';
        console.log("✅ Botão Adicionar Evento exibido");
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.style.display = 'inline-flex';
        console.log("✅ Botão Zerar Pontos exibido");
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
    
    // Ocultar também os botões administrativos individualmente
    const addEventBtn = document.getElementById('addEventBtn');
    if (addEventBtn) {
        addEventBtn.style.display = 'none';
        console.log("✅ Botão Adicionar Evento ocultado");
    }
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.style.display = 'none';
        console.log("✅ Botão Zerar Pontos ocultado");
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
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'flex';
                console.log("✅ Modal de login exibido (modo não autenticado)");
            }
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
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'flex';
                }
            });
        }
    } else {
        console.log("Botão admin não encontrado, aguardando carregamento da página");
        
        // Tentar novamente após um curto intervalo (para garantir que o DOM esteja carregado)
        setTimeout(setupAdminButton, 500);
    }
}