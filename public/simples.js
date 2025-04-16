// Script simplificado de autenticação
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de autenticação simplificado carregando...');
    
    // Criar o botão de autenticação no topo da página se não existir
    function criarBotaoLogin() {
        const header = document.querySelector('header');
        if (!header) return;
        
        const loginBtns = document.querySelectorAll('.login-button');
        // Se não achar nenhum botão de login, criamos um
        if (loginBtns.length === 0) {
            const btn = document.createElement('button');
            btn.id = 'loginBtn';
            btn.className = 'login-button';
            btn.innerHTML = '<span class="login-icon">🔑</span><span>Login</span>';
            header.appendChild(btn);
            configurarBotaoLogin(btn);
        } else {
            // Configure cada botão de login existente
            loginBtns.forEach(btn => {
                if (btn && btn.id === 'loginBtn') {
                    console.log('Botão de login encontrado:', btn);
                    configurarBotaoLogin(btn);
                }
            });
        }
    }
    
    // Configurar o evento do botão de login
    function configurarBotaoLogin(btn) {
        // Remover eventos existentes
        const novoBtn = btn.cloneNode(true);
        if (btn.parentNode) {
            btn.parentNode.replaceChild(novoBtn, btn);
        }
        
        // Verificar se já está autenticado
        const autenticado = verificarAutenticacao();
        
        if (autenticado) {
            novoBtn.innerHTML = '<span class="login-icon">🔓</span><span>Sair</span>';
            novoBtn.addEventListener('click', function() {
                console.log('Logout clicado');
                logout();
            });
        } else {
            novoBtn.innerHTML = '<span class="login-icon">🔑</span><span>Login</span>';
            novoBtn.addEventListener('click', function() {
                console.log('Login clicado');
                console.log('Abrindo modal de login');
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'flex';
                } else {
                    // Se o modal não existir, criamos e abrimos
                    abrirModalLogin();
                }
            });
        }
    }
    
    // Verificar autenticação do usuário
    function verificarAutenticacao() {
        const dados = localStorage.getItem('escalasUserData');
        if (dados) {
            try {
                const usuario = JSON.parse(dados);
                if (usuario && usuario.isAdmin) {
                    console.log('Usuário autenticado:', usuario);
                    atualizarInterfaceLogado();
                    return true;
                }
            } catch (e) {
                console.error('Erro ao verificar autenticação:', e);
                localStorage.removeItem('escalasUserData');
            }
        }
        
        console.log('Usuário não autenticado');
        atualizarInterfaceDeslogado();
        return false;
    }
    
    // Atualizar interface quando logado
    function atualizarInterfaceLogado() {
        // Mostrar botões de administração
        const adminBotoes = document.querySelector('.admin-buttons');
        if (adminBotoes) {
            adminBotoes.style.display = 'flex';
        }
        
        // Mostrar apenas elementos administrativos que não sejam de edição de equipes
        document.querySelectorAll('.admin-only').forEach(el => {
            // Verificar se o elemento não está relacionado à edição de equipes
            const id = el.id || '';
            if (!id.includes('editEquipe')) {
                el.style.display = el.tagName.toLowerCase() === 'button' ? 'inline-flex' : 'block';
            }
        });
    }
    
    // Atualizar interface quando deslogado
    function atualizarInterfaceDeslogado() {
        // Esconder botões de administração
        const adminBotoes = document.querySelector('.admin-buttons');
        if (adminBotoes) {
            adminBotoes.style.display = 'none';
        }
        
        // Esconder outros elementos administrativos
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Função de logout
    async function logout() {
        try {
            // Chamar API de logout (opcional, pois estamos usando localStorage)
            // A API não está sendo chamada agora, mas será importante se implementarmos sessões no servidor
            
            // Remover dados do usuário do localStorage
            localStorage.removeItem('escalasUserData');
            alert('Logout realizado com sucesso!');
            window.location.reload();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            alert('Erro ao fazer logout: ' + error.message);
        }
    }
    
    // Criar e abrir modal de login
    function abrirModalLogin() {
        console.log('Abrindo modal de login');
        let modal = document.getElementById('loginModal');
        
        // Se o modal não existir, criar
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'loginModal';
            modal.className = 'modal';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Área Administrativa</h2>
                        <button id="fecharModal" class="close-btn">&times;</button>
                    </div>
                    <div class="form-group">
                        <label for="username">Usuário:</label>
                        <input type="text" id="username" value="admin">
                    </div>
                    <div class="form-group">
                        <label for="password">Senha:</label>
                        <input type="password" id="password" value="admin123">
                    </div>
                    <div id="loginErro" style="color: red; margin-top: 10px; display: none;">
                        Usuário ou senha incorretos!
                    </div>
                    <button id="btnEntrar" class="btn">Entrar</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Configurar eventos do modal
            const fecharModal = document.getElementById('fecharModal');
            if (fecharModal) {
                fecharModal.addEventListener('click', function() {
                    modal.classList.remove('active');
                });
            }
            
            const btnEntrar = document.getElementById('btnEntrar');
            if (btnEntrar) {
                btnEntrar.addEventListener('click', fazerLogin);
            }
            
            // Permitir login com Enter
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        fazerLogin();
                    }
                });
            }
        }
        
        // Mostrar o modal
        modal.classList.add('active');
    }
    
    // Processar o login
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
            
            if (!response.ok) {
                throw new Error('Credenciais inválidas');
            }
            
            // Login bem-sucedido
            const userData = await response.json();
            localStorage.setItem('escalasUserData', JSON.stringify(userData));
            
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.remove('active');
            }
            
            // Atualizar a interface
            verificarAutenticacao();
            
            // Recarregar a página para garantir que tudo funcione
            window.location.reload();
        } catch (error) {
            console.error('Erro no login:', error);
            
            const loginErro = document.getElementById('loginErro');
            if (loginErro) {
                loginErro.style.display = 'block';
                loginErro.textContent = 'Usuário ou senha incorretos.';
                setTimeout(() => {
                    loginErro.style.display = 'none';
                }, 3000);
            }
        }
    }
    
    // Inicializar
    criarBotaoLogin();
    verificarAutenticacao();
});