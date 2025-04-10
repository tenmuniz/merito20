// Script de autenticação ultrasimples
console.log('Carregando script de autenticação ultra-simplificado');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, criando botão de login fixo');
    
    // Criar um botão fixo no topo da página
    function criarBotaoFixo() {
        // Criar o botão login diretamente
        const btn = document.createElement('button');
        btn.id = 'loginBotao';
        btn.textContent = 'LOGAR COMO ADMIN';
        btn.style.position = 'fixed';
        btn.style.top = '100px';
        btn.style.right = '20px';
        btn.style.zIndex = '9999';
        btn.style.padding = '10px 20px';
        btn.style.backgroundColor = '#ff0000';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '5px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        
        // Adicionar o botão no corpo do documento
        document.body.appendChild(btn);
        
        // Adicionar evento de clique
        btn.addEventListener('click', function() {
            // Login direto sem perguntar
            const userData = {
                id: 1,
                username: 'admin',
                fullName: 'Administrador',
                isAdmin: true
            };
            
            localStorage.setItem('escalasUserData', JSON.stringify(userData));
            alert('Logado como administrador! A página será recarregada.');
            window.location.reload();
        });
    }
    
    // Função para verificar se o usuário está logado
    function verificarLogin() {
        const dados = localStorage.getItem('escalasUserData');
        if (!dados) return false;
        
        try {
            const user = JSON.parse(dados);
            if (user && user.isAdmin) {
                // Mostrar elementos administrativos
                const adminElements = document.querySelectorAll('.admin-only');
                adminElements.forEach(el => {
                    el.style.display = el.tagName.toLowerCase() === 'button' ? 'inline-flex' : 'block';
                });
                
                // Mostrar área administrativa
                const adminButtons = document.querySelector('.admin-buttons');
                if (adminButtons) {
                    adminButtons.style.display = 'flex';
                }
                
                // Adicionar botão de logout
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'logoutBotao';
                logoutBtn.textContent = 'SAIR';
                logoutBtn.style.position = 'fixed';
                logoutBtn.style.top = '100px';
                logoutBtn.style.right = '20px';
                logoutBtn.style.zIndex = '9999';
                logoutBtn.style.padding = '10px 20px';
                logoutBtn.style.backgroundColor = '#4CAF50';
                logoutBtn.style.color = 'white';
                logoutBtn.style.border = 'none';
                logoutBtn.style.borderRadius = '5px';
                logoutBtn.style.cursor = 'pointer';
                logoutBtn.style.fontWeight = 'bold';
                
                document.body.appendChild(logoutBtn);
                
                logoutBtn.addEventListener('click', function() {
                    localStorage.removeItem('escalasUserData');
                    alert('Deslogado com sucesso! A página será recarregada.');
                    window.location.reload();
                });
                
                return true;
            }
        } catch (e) {
            console.error('Erro ao verificar login:', e);
        }
        
        return false;
    }
    
    // Executar
    const logado = verificarLogin();
    if (!logado) {
        criarBotaoFixo();
    }
});