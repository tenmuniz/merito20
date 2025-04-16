// Sistema de autenticação global
function checkGlobalAuth() {
    console.log("Verificando autenticação global...");
    const userData = localStorage.getItem('escalasUserData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user && user.isAdmin) {
                console.log("Usuário autenticado como admin:", user);
                
                // Tornar visíveis todos os elementos administrativos
                // com exceção dos botões de edição (conforme solicitado)
                const adminElements = document.querySelectorAll('.admin-only:not(.edit-btn)');
                adminElements.forEach(el => {
                    // Preservar os event listeners originais ao mostrar os elementos
                    const originalDisplay = el.tagName.toLowerCase() === 'button' ? 'inline-flex' : 'block';
                    el.style.display = originalDisplay;
                    
                    // Garantir que o elemento é clicável
                    el.style.pointerEvents = 'auto';
                    el.style.cursor = 'pointer';
                    el.style.position = 'relative';
                    el.style.zIndex = '100';
                });
                
                // Chama initEditButtons, mas esta função agora oculta os botões de edição
                initEditButtons();
                
                // Atualizar botão de login para "Sair"
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) {
                    loginBtn.innerHTML = '<span>🔓</span><span>Sair</span>';
                    
                    // Remover todos os event listeners existentes
                    const newLoginBtn = loginBtn.cloneNode(true);
                    loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
                    
                    // Adicionar novo event listener para logout
                    newLoginBtn.addEventListener('click', function() {
                        logout();
                    });
                }
                
                return true;
            }
        } catch (e) {
            console.error('Erro ao processar dados de autenticação:', e);
            localStorage.removeItem('escalasUserData');
        }
    } else {
        console.log("Usuário não autenticado");
    }
    return false;
}

// Funções para modais de edição
// Estas funções serão disponíveis globalmente para o script escalas.html
// Função openAniversariantesModal removida

// Função renderAniversariantesList removida

// Funções editAniversariante e deleteAniversariante foram removidas

function openEquipeModal(equipe) {
    console.log("Abrindo modal de equipe", equipe);
    const equipeModal = document.getElementById('equipeModal');
    if (equipeModal) {
        const equipeModalTitle = document.getElementById('equipeModalTitle');
        if (equipeModalTitle) {
            equipeModalTitle.textContent = `Editar Equipe ${equipe.toUpperCase()}`;
        }
        
        window.currentEquipe = equipe;
        renderEquipeMembersList();
        equipeModal.classList.add('active');
    }
}

function renderEquipeMembersList() {
    const equipeMembersList = document.getElementById('equipeMembersList');
    if (!equipeMembersList || !window.currentEquipe) return;
    
    const membros = JSON.parse(localStorage.getItem(`equipe_${window.currentEquipe}`) || '[]');
    equipeMembersList.innerHTML = '';
    
    membros.forEach((membro, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        
        itemRow.innerHTML = `
            <div class="item-text">
                <strong>${membro}</strong>
            </div>
            <div class="item-actions">
                <button class="item-btn edit" data-index="${index}">✏️</button>
                <button class="item-btn delete" data-index="${index}">🗑️</button>
            </div>
        `;
        
        equipeMembersList.appendChild(itemRow);
    });
    
    // Adicionar event listeners
    const editButtons = equipeMembersList.querySelectorAll('.item-btn.edit');
    const deleteButtons = equipeMembersList.querySelectorAll('.item-btn.delete');
    
    editButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            editMembro(index);
        });
    });
    
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            deleteMembro(index);
        });
    });
}

function editMembro(index) {
    if (!window.currentEquipe) return;
    
    const membros = JSON.parse(localStorage.getItem(`equipe_${window.currentEquipe}`) || '[]');
    const membroNome = document.getElementById('membroNome');
    const membroForm = document.getElementById('membroForm');
    const addMembroBtn = document.getElementById('addMembroBtn');
    
    if (index >= 0 && index < membros.length && membroNome) {
        membroNome.value = membros[index];
        window.editingMembroIndex = index;
        
        if (membroForm && addMembroBtn) {
            membroForm.style.display = 'block';
            addMembroBtn.style.display = 'none';
        }
    }
}

function deleteMembro(index) {
    if (!window.currentEquipe) return;
    
    if (confirm('Tem certeza que deseja remover este policial?')) {
        let membros = JSON.parse(localStorage.getItem(`equipe_${window.currentEquipe}`) || '[]');
        membros.splice(index, 1);
        localStorage.setItem(`equipe_${window.currentEquipe}`, JSON.stringify(membros));
        renderEquipeMembersList();
        updateEquipesUI();
    }
}

function openInfoModal(infoType) {
    console.log("Abrindo modal de informações", infoType);
    const infoModal = document.getElementById('infoModal');
    if (infoModal) {
        const infoModalTitle = document.getElementById('infoModalTitle');
        const infoTypes = {
            'ferias': 'Férias',
            'licencas': 'Licença Especial',
            'expediente': 'Expediente'
        };
        
        if (infoModalTitle) {
            infoModalTitle.textContent = `Editar ${infoTypes[infoType]}`;
        }
        
        window.currentInfoType = infoType;
        renderInfoList();
        infoModal.classList.add('active');
    }
}

function renderInfoList() {
    const infoList = document.getElementById('infoList');
    if (!infoList || !window.currentInfoType) return;
    
    const infos = JSON.parse(localStorage.getItem(`info_${window.currentInfoType}`) || '[]');
    infoList.innerHTML = '';
    
    infos.forEach((info, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        
        itemRow.innerHTML = `
            <div class="item-text">
                ${info}
            </div>
            <div class="item-actions">
                <button class="item-btn edit" data-index="${index}">✏️</button>
                <button class="item-btn delete" data-index="${index}">🗑️</button>
            </div>
        `;
        
        infoList.appendChild(itemRow);
    });
    
    // Adicionar event listeners
    const editButtons = infoList.querySelectorAll('.item-btn.edit');
    const deleteButtons = infoList.querySelectorAll('.item-btn.delete');
    
    editButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            editInfo(index);
        });
    });
    
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            deleteInfo(index);
        });
    });
}

function editInfo(index) {
    if (!window.currentInfoType) return;
    
    const infos = JSON.parse(localStorage.getItem(`info_${window.currentInfoType}`) || '[]');
    const infoTexto = document.getElementById('infoTexto');
    const infoForm = document.getElementById('infoForm');
    const addInfoBtn = document.getElementById('addInfoBtn');
    
    if (index >= 0 && index < infos.length && infoTexto) {
        infoTexto.value = infos[index];
        window.editingInfoIndex = index;
        
        if (infoForm && addInfoBtn) {
            infoForm.style.display = 'block';
            addInfoBtn.style.display = 'none';
        }
    }
}

function deleteInfo(index) {
    if (!window.currentInfoType) return;
    
    if (confirm('Tem certeza que deseja excluir esta informação?')) {
        let infos = JSON.parse(localStorage.getItem(`info_${window.currentInfoType}`) || '[]');
        infos.splice(index, 1);
        localStorage.setItem(`info_${window.currentInfoType}`, JSON.stringify(infos));
        renderInfoList();
        updateInfoUI();
    }
}

// Funções de atualização UI
// Função updateAniversariantesUI removida

function updateEquipesUI() {
    const equipes = ['alfa', 'bravo', 'charlie'];
    
    equipes.forEach(equipe => {
        const membros = JSON.parse(localStorage.getItem(`equipe_${equipe}`) || '[]');
        const container = document.querySelector(`.equipe-${equipe} .equipe-membros`);
        if (!container) return;
        
        // Limpar o container
        container.innerHTML = '';
        
        // Adicionar cada membro da equipe
        membros.forEach(membro => {
            const li = document.createElement('li');
            li.className = 'equipe-membro';
            li.innerHTML = `<strong>${membro}</strong>`;
            container.appendChild(li);
        });
        
        // Atualizar título com o número de policiais
        const title = document.querySelector(`.equipe-${equipe} .equipe-title`);
        if (title) {
            const titleText = title.textContent;
            // Usar regex para substituir o número entre parênteses
            const updatedText = titleText.replace(/\(\d+\s+Policiais\)/, `(${membros.length} Policiais)`);
            title.innerHTML = ''; // Limpar o título
            
            // Adicionar badge
            const badge = document.createElement('span');
            badge.className = `equipe-title-badge badge-${equipe}`;
            badge.textContent = equipe.toUpperCase();
            title.appendChild(badge);
            
            // Adicionar texto atualizado
            const textNode = document.createTextNode(` Equipe ${equipe.charAt(0).toUpperCase() + equipe.slice(1)} (${membros.length} Policiais)`);
            title.appendChild(textNode);
            
            // Adicionar botão de edição
            const editBtn = document.getElementById(`editEquipe${equipe.charAt(0).toUpperCase() + equipe.slice(1)}Btn`);
            if (editBtn) {
                title.appendChild(editBtn);
            }
        }
    });
}

function updateInfoUI() {
    const infoTypes = ['ferias', 'licencas', 'expediente'];
    
    infoTypes.forEach(type => {
        const infos = JSON.parse(localStorage.getItem(`info_${type}`) || '[]');
        const container = document.querySelector(`.box-${type} .info-list`);
        if (!container) return;
        
        // Limpar o container
        container.innerHTML = '';
        
        // Adicionar cada informação
        infos.forEach(info => {
            const li = document.createElement('li');
            li.className = 'info-item';
            
            // Verificar se há parênteses para destacar
            if (info.includes('(')) {
                const parts = info.split('(');
                const nome = parts[0].trim();
                const complemento = '(' + parts[1];
                
                li.innerHTML = `<span class="info-destaque">${nome}</span> ${complemento}`;
            } else {
                li.textContent = info;
            }
            
            container.appendChild(li);
        });
    });
}

// Função para inicializar os botões de edição (desativada)
function initEditButtons() {
    // Os botões de edição foram desativados conforme solicitado pelo usuário
    console.log("Botões de edição desativados por solicitação do usuário");
    
    // Remover botões de edição da UI
    const editButtons = [
        'editEquipeAlfaBtn', 'editEquipeBravoBtn', 'editEquipeCharlieBtn',
        'editAniversariantesBtn', 'editFeriasBtn', 'editLicencasBtn', 'editExpedienteBtn'
    ];
    
    editButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.style.display = 'none';
        }
    });
}
    
    // Configurar botões de gerenciamento de formulários
    // Remoção do código do botão closeAniversariantesModal
    
    const closeEquipeModalBtn = document.getElementById('closeEquipeModal');
    if (closeEquipeModalBtn) {
        console.log("Configurando botão de fechar modal de equipe");
        closeEquipeModalBtn.onclick = function() {
            console.log("Clicou em fechar modal de equipe");
            if (typeof fecharEquipeModal === 'function') {
                fecharEquipeModal();
            } else {
                console.log("Função fecharEquipeModal não encontrada, usando implementação alternativa");
                const modal = document.getElementById('equipeModal');
                if (modal) modal.classList.remove('active');
                const form = document.getElementById('membroForm');
                if (form) form.style.display = 'none';
                const addBtn = document.getElementById('addMembroBtn');
                if (addBtn) addBtn.style.display = 'block';
                window.currentEquipe = null;
            }
        };
    }
    
    const closeInfoModal = document.getElementById('closeInfoModal');
    if (closeInfoModal) {
        closeInfoModal.onclick = function() {
            const modal = document.getElementById('infoModal');
            if (modal) modal.classList.remove('active');
            const form = document.getElementById('infoForm');
            if (form) form.style.display = 'none';
            const addBtn = document.getElementById('addInfoBtn');
            if (addBtn) addBtn.style.display = 'block';
            window.currentInfoType = null;
        };
    }
    
    // Configurar botões de adição e salvamento
    // Remoção do código do botão addAniversarianteBtn
    
    const addMembroBtn = document.getElementById('addMembroBtn');
    if (addMembroBtn) {
        addMembroBtn.onclick = function() {
            const form = document.getElementById('membroForm');
            if (form) form.style.display = 'block';
            addMembroBtn.style.display = 'none';
        };
    }
    
    const addInfoBtn = document.getElementById('addInfoBtn');
    if (addInfoBtn) {
        addInfoBtn.onclick = function() {
            const form = document.getElementById('infoForm');
            if (form) form.style.display = 'block';
            addInfoBtn.style.display = 'none';
        };
    }
    
    // Botões de salvamento
    // Remoção do código do botão saveAniversarianteForm
    
    const saveMembroForm = document.getElementById('saveMembroForm');
    if (saveMembroForm) {
        saveMembroForm.onclick = function() {
            const nome = document.getElementById('membroNome').value;
            
            if (!nome) {
                alert('Preencha o nome do policial!');
                return;
            }
            
            if (!window.currentEquipe) {
                alert('Erro: Equipe não selecionada!');
                return;
            }
            
            const membros = JSON.parse(localStorage.getItem(`equipe_${window.currentEquipe}`) || '[]');
            
            if (window.editingMembroIndex !== null && window.editingMembroIndex !== undefined) {
                // Editar existente
                membros[window.editingMembroIndex] = nome;
            } else {
                // Adicionar novo
                membros.push(nome);
            }
            
            localStorage.setItem(`equipe_${window.currentEquipe}`, JSON.stringify(membros));
            
            // Ocultar formulário
            const form = document.getElementById('membroForm');
            if (form) form.style.display = 'none';
            if (addMembroBtn) addMembroBtn.style.display = 'block';
            
            // Atualizar interface
            renderEquipeMembersList();
            updateEquipesUI();
        };
    }
    
    const saveInfoForm = document.getElementById('saveInfoForm');
    if (saveInfoForm) {
        saveInfoForm.onclick = function() {
            const texto = document.getElementById('infoTexto').value;
            
            if (!texto) {
                alert('Preencha a informação!');
                return;
            }
            
            if (!window.currentInfoType) {
                alert('Erro: Tipo de informação não selecionado!');
                return;
            }
            
            const infos = JSON.parse(localStorage.getItem(`info_${window.currentInfoType}`) || '[]');
            
            if (window.editingInfoIndex !== null && window.editingInfoIndex !== undefined) {
                // Editar existente
                infos[window.editingInfoIndex] = texto;
            } else {
                // Adicionar novo
                infos.push(texto);
            }
            
            localStorage.setItem(`info_${window.currentInfoType}`, JSON.stringify(infos));
            
            // Ocultar formulário
            const form = document.getElementById('infoForm');
            if (form) form.style.display = 'none';
            if (addInfoBtn) addInfoBtn.style.display = 'block';
            
            // Atualizar interface
            renderInfoList();
            updateInfoUI();
        };
    }
    
    // Botões de cancelamento
    // Remoção do código do botão cancelAniversarianteForm
    
    const cancelMembroForm = document.getElementById('cancelMembroForm');
    if (cancelMembroForm) {
        cancelMembroForm.onclick = function() {
            const form = document.getElementById('membroForm');
            if (form) form.style.display = 'none';
            if (addMembroBtn) addMembroBtn.style.display = 'block';
        };
    }
    
    const cancelInfoForm = document.getElementById('cancelInfoForm');
    if (cancelInfoForm) {
        cancelInfoForm.onclick = function() {
            const form = document.getElementById('infoForm');
            if (form) form.style.display = 'none';
            if (addInfoBtn) addInfoBtn.style.display = 'block';
        };
    }
}

function logout() {
    console.log("Realizando logout...");
    localStorage.removeItem('escalasUserData');
    alert('Você saiu da área administrativa.');
    window.location.reload();
}

// Autenticar com um clique no botão login
function setupLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && !localStorage.getItem('escalasUserData')) {
        // Remover todos os event listeners existentes
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        
        // Adicionar evento para abrir modal de login
        newLoginBtn.addEventListener('click', function() {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.add('active');
                const usernameInput = document.getElementById('username');
                if (usernameInput) usernameInput.focus();
            }
        });
    }
}

// Função para validar login
function validarLogin(username, password) {
    if (username === 'admin' && password === 'admin123') {
        const userData = {
            id: 1,
            username: 'admin',
            fullName: 'Administrador',
            isAdmin: true
        };
        
        localStorage.setItem('escalasUserData', JSON.stringify(userData));
        return true;
    }
    return false;
}

// Executar verificação de autenticação em todas as páginas
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, configurando autenticação global");
    checkGlobalAuth();
    setupLoginButton();
    
    // Configurar botão de login no modal se existir
    const submitLoginBtn = document.getElementById('submitLogin');
    if (submitLoginBtn) {
        submitLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (validarLogin(username, password)) {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) loginModal.classList.remove('active');
                
                window.location.reload(); // Recarregar para aplicar permissões
            } else {
                const loginAlert = document.getElementById('loginAlert');
                if (loginAlert) {
                    loginAlert.textContent = 'Usuário ou senha incorretos. Tente novamente.';
                    loginAlert.style.display = 'block';
                }
            }
        });
    }
    
    // Fechar modal se existir
    const closeLoginModal = document.getElementById('closeLoginModal');
    const cancelLogin = document.getElementById('cancelLogin');
    
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', function() {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.classList.remove('active');
        });
    }
    
    if (cancelLogin) {
        cancelLogin.addEventListener('click', function() {
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.classList.remove('active');
        });
    }
});

// Tabela de pontuações para o sistema de meritocracia
const TABELA_PONTUACOES = {
    armas: [
        { descricao: "Apreensão de arma de fogo (com ou sem munição)", pontos: 100 },
        { descricao: "Apreensão de arma branca (faca, terçado, etc.)", pontos: 25 },
        { descricao: "Apreensão de simulacro de arma de fogo", pontos: 40 }
    ],
    entorpecentes: [
        { descricao: "Até 20g", pontos: 20 },
        { descricao: "21g a 50g", pontos: 35 },
        { descricao: "51g a 100g", pontos: 50 },
        { descricao: "101g a 200g", pontos: 70 },
        { descricao: "201g a 499g", pontos: 90 },
        { descricao: "500g a 999g", pontos: 120 },
        { descricao: "1kg a 1,9kg", pontos: 160 },
        { descricao: "2kg ou mais", pontos: 200 }
    ],
    crimes: [
        { descricao: "Furto", pontos: 60 },
        { descricao: "Homicídio", pontos: 150 },
        { descricao: "Maria da Penha", pontos: 60 },
        { descricao: "Ato infracional", pontos: 50 }
    ],
    veiculosForagidos: [
        { descricao: "Recuperação de veículo com registro de roubo ou furto", pontos: 100 },
        { descricao: "Apreensão de veículo com adulteração de sinal identificador", pontos: 60 },
        { descricao: "Mandado de prisão", pontos: 100 },
        { descricao: "Prisão por descumprimento de medida cautelar", pontos: 70 }
    ]
};

// Função para criar a modal de pontuações
function criarModalPontuacoes() {
    const modalHTML = `
    <div id="pontuacoesModal" class="pontuacoes-modal">
        <div class="pontuacoes-modal-content">
            <div class="modal-header">
                <h2 class="modal-title">Sistema de Pontuação</h2>
                <button class="close-button" onclick="fecharModalPontuacoes()">&times;</button>
            </div>
            <div class="pontuacoes-container">
                <div class="categoria-box">
                    <h3 class="categoria-title">
                        <span class="categoria-icon">🔫</span>
                        Armas
                    </h3>
                    <ul class="pontuacoes-lista">
                        ${TABELA_PONTUACOES.armas.map(item => 
                            `<li class="pontuacao-item">
                                <span class="pontuacao-descricao">${item.descricao}</span>
                                <span class="pontuacao-valor">${item.pontos} pontos</span>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="categoria-box">
                    <h3 class="categoria-title">
                        <span class="categoria-icon">💊</span>
                        Entorpecentes
                    </h3>
                    <ul class="pontuacoes-lista">
                        ${TABELA_PONTUACOES.entorpecentes.map(item => 
                            `<li class="pontuacao-item">
                                <span class="pontuacao-descricao">${item.descricao}</span>
                                <span class="pontuacao-valor">${item.pontos} pontos</span>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="categoria-box">
                    <h3 class="categoria-title">
                        <span class="categoria-icon">⚖️</span>
                        Crimes
                    </h3>
                    <ul class="pontuacoes-lista">
                        ${TABELA_PONTUACOES.crimes.map(item => 
                            `<li class="pontuacao-item">
                                <span class="pontuacao-descricao">${item.descricao}</span>
                                <span class="pontuacao-valor">${item.pontos} pontos</span>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="categoria-box">
                    <h3 class="categoria-title">
                        <span class="categoria-icon">🚗</span>
                        Veículos e Foragidos
                    </h3>
                    <ul class="pontuacoes-lista">
                        ${TABELA_PONTUACOES.veiculosForagidos.map(item => 
                            `<li class="pontuacao-item">
                                <span class="pontuacao-descricao">${item.descricao}</span>
                                <span class="pontuacao-valor">${item.pontos} pontos</span>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
            <div class="pontuacoes-footer">
                <p>Sistema de meritocracia - 20ª CIPM</p>
            </div>
        </div>
    </div>
    `;
    
    // Adicionar a modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Adicionar estilos para a modal
    const estilos = `
    <style>
        .pontuacoes-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            overflow-y: auto;
            backdrop-filter: blur(5px);
        }
        
        .pontuacoes-modal-content {
            background-color: white;
            margin: 2rem auto;
            padding: 2rem;
            border-radius: 12px;
            max-width: 900px;
            width: 90%;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
            animation: modal-appear 0.3s ease;
        }
        
        .pontuacoes-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
        }
        
        .categoria-box {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 1.2rem;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .categoria-box:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.12);
        }
        
        .categoria-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.2rem;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .categoria-icon {
            font-size: 1.5rem;
        }
        
        .pontuacoes-lista {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }
        
        .pontuacao-item {
            display: flex;
            justify-content: space-between;
            padding: 0.7rem 0;
            border-bottom: 1px dashed #e2e8f0;
        }
        
        .pontuacao-item:last-child {
            border-bottom: none;
        }
        
        .pontuacao-descricao {
            flex: 1;
            padding-right: 1rem;
        }
        
        .pontuacao-valor {
            font-weight: bold;
            color: #1e3a8a;
            white-space: nowrap;
        }
        
        .pontuacoes-footer {
            text-align: center;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .pontuacoes-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(to right, #1e3a8a, #3949ab);
            color: white;
            border: none;
            padding: 0.7rem 1.2rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
        }
        
        .pontuacoes-btn:hover {
            background: linear-gradient(to right, #3949ab, #5c6bc0);
            transform: translateY(-2px);
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
        }
        
        @media (max-width: 768px) {
            .pontuacoes-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', estilos);
}

// Função para abrir a modal de pontuações
function abrirModalPontuacoes() {
    const modal = document.getElementById('pontuacoesModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Função para fechar a modal de pontuações
function fecharModalPontuacoes() {
    const modal = document.getElementById('pontuacoesModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Inicializar a modal quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    criarModalPontuacoes();
    
    // Fechar modal ao clicar fora dela
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('pontuacoesModal');
        if (event.target === modal) {
            fecharModalPontuacoes();
        }
    });
});