// Sistema de edição direta para férias, licenças e expediente na página escalas.html

// Sobrescrever a função original de openInfoModal
function openInfoModal(infoType) {
    console.log("Abrindo edição direta para:", infoType);
    
    // Iniciar modo de edição para o tipo de informação
    const section = document.querySelector(`.box-${infoType}`);
    if (!section) return;
    
    // Verificar se já está em modo de edição
    if (section.classList.contains('edit-mode')) {
        // Sair do modo de edição
        exitInfoEditMode(infoType, section);
    } else {
        // Entrar em modo de edição
        enterInfoEditMode(infoType, section);
    }
}

// Entrar em modo de edição
function enterInfoEditMode(infoType, section) {
    // Adicionar classe de modo de edição
    section.classList.add('edit-mode');
    
    // Mudar o botão de editar para salvar
    const editBtn = section.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.textContent = "💾 Salvar";
        editBtn.classList.add('save-btn');
    }
    
    // Mostrar formulário de adição
    showInfoAddForm(infoType, section);
    
    // Mostrar botões de remoção para cada item
    showInfoRemoveButtons(infoType, section);
}

// Sair do modo de edição
function exitInfoEditMode(infoType, section) {
    // Remover classe de modo de edição
    section.classList.remove('edit-mode');
    
    // Mudar o botão de salvar para editar
    const editBtn = section.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.textContent = "✏️ Editar";
        editBtn.classList.remove('save-btn');
    }
    
    // Remover formulário de adição
    const addForm = section.querySelector('.info-add-form');
    if (addForm) {
        addForm.remove();
    }
    
    // Atualizar a lista de itens (remover botões de exclusão)
    updateInfoItems(infoType, section);
}

// Mostrar formulário de adição
function showInfoAddForm(infoType, section) {
    // Obter o container onde fica a lista de itens
    const itemsContainer = section.querySelector('.info-list');
    if (!itemsContainer) return;
    
    // Verificar se o formulário já existe
    let addForm = section.querySelector('.info-add-form');
    
    if (!addForm) {
        // Criar formulário de adição
        addForm = document.createElement('div');
        addForm.className = 'info-add-form';
        
        // Obter todos os militares disponíveis
        const allTeams = ['alfa', 'bravo', 'charlie'];
        const allMilitaries = [];
        
        allTeams.forEach(team => {
            const members = JSON.parse(localStorage.getItem(`equipe_${team}`)) || [];
            allMilitaries.push(...members);
        });
        
        // Ordenar militares por patente/graduação
        const sortedMilitaries = sortMilitariesByRank(allMilitaries);
        
        // Configurar o formulário com campos apropriados para cada tipo de informação
        let formHtml = '';
        
        if (infoType === 'ferias') {
            formHtml = `
                <div class="form-title">Adicionar Período de Férias</div>
                <div class="form-content">
                    <div class="form-field">
                        <label for="ferias-militar">Militar:</label>
                        <select id="ferias-militar" class="info-select">
                            <option value="">Selecione um militar</option>
                            ${sortedMilitaries.map(mil => `<option value="${mil}">${mil}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="ferias-inicio">Data Início:</label>
                        <input type="date" id="ferias-inicio" class="info-date">
                    </div>
                    <div class="form-field">
                        <label for="ferias-fim">Data Fim:</label>
                        <input type="date" id="ferias-fim" class="info-date">
                    </div>
                    <button class="info-add-btn" data-type="${infoType}">Adicionar</button>
                </div>
            `;
        } else if (infoType === 'licencas') {
            formHtml = `
                <div class="form-title">Adicionar Licença Especial</div>
                <div class="form-content">
                    <div class="form-field">
                        <label for="licenca-militar">Militar:</label>
                        <select id="licenca-militar" class="info-select">
                            <option value="">Selecione um militar</option>
                            ${sortedMilitaries.map(mil => `<option value="${mil}">${mil}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="licenca-tipo">Tipo:</label>
                        <select id="licenca-tipo" class="info-select">
                            <option value="Licença Prêmio">Licença Prêmio</option>
                            <option value="Licença Saúde">Licença Saúde</option>
                            <option value="Licença Maternidade">Licença Maternidade</option>
                            <option value="Licença Paternidade">Licença Paternidade</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label for="licenca-inicio">Data Início:</label>
                        <input type="date" id="licenca-inicio" class="info-date">
                    </div>
                    <div class="form-field">
                        <label for="licenca-fim">Data Fim:</label>
                        <input type="date" id="licenca-fim" class="info-date">
                    </div>
                    <button class="info-add-btn" data-type="${infoType}">Adicionar</button>
                </div>
            `;
        } else if (infoType === 'expediente') {
            formHtml = `
                <div class="form-title">Adicionar Informação de Expediente</div>
                <div class="form-content">
                    <div class="form-field">
                        <label for="expediente-texto">Informação:</label>
                        <input type="text" id="expediente-texto" class="info-text" placeholder="Ex: Reunião de Comando às 14h">
                    </div>
                    <button class="info-add-btn" data-type="${infoType}">Adicionar</button>
                </div>
            `;
        }
        
        addForm.innerHTML = formHtml;
        
        // Adicionar antes da lista de itens
        itemsContainer.parentNode.insertBefore(addForm, itemsContainer);
        
        // Adicionar evento ao botão de adicionar
        const addBtn = addForm.querySelector('.info-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                addInfoItem(this.getAttribute('data-type'));
            });
        }
    } else {
        // Mostrar o formulário se estiver escondido
        addForm.style.display = 'block';
    }
}

// Adicionar um novo item
function addInfoItem(infoType) {
    try {
        let item = null;
        
        if (infoType === 'ferias') {
            const military = document.getElementById('ferias-militar').value;
            const startDate = document.getElementById('ferias-inicio').value;
            const endDate = document.getElementById('ferias-fim').value;
            
            if (!military || !startDate || !endDate) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                alert('A data de início deve ser anterior à data de término.');
                return;
            }
            
            // Formatar as datas para exibição
            const start = formatarData(startDate);
            const end = formatarData(endDate);
            
            item = `${military} - Férias de ${start} até ${end}`;
        } else if (infoType === 'licencas') {
            const military = document.getElementById('licenca-militar').value;
            const type = document.getElementById('licenca-tipo').value;
            const startDate = document.getElementById('licenca-inicio').value;
            const endDate = document.getElementById('licenca-fim').value;
            
            if (!military || !startDate || !endDate) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                alert('A data de início deve ser anterior à data de término.');
                return;
            }
            
            // Formatar as datas para exibição
            const start = formatarData(startDate);
            const end = formatarData(endDate);
            
            item = `${military} - ${type} de ${start} até ${end}`;
        } else if (infoType === 'expediente') {
            const text = document.getElementById('expediente-texto').value;
            
            if (!text) {
                alert('Por favor, insira uma informação.');
                return;
            }
            
            item = text;
        }
        
        if (item) {
            // Salvar no localStorage
            const items = JSON.parse(localStorage.getItem(`info_${infoType}`) || '[]');
            items.push(item);
            localStorage.setItem(`info_${infoType}`, JSON.stringify(items));
            
            // Atualizar a interface
            const section = document.querySelector(`.box-${infoType}`);
            if (section) {
                // Se estiver em modo de edição, mostrar os botões de remover
                if (section.classList.contains('edit-mode')) {
                    showInfoRemoveButtons(infoType, section);
                } else {
                    updateInfoItems(infoType, section);
                }
                
                // Limpar os campos do formulário
                if (infoType === 'ferias') {
                    document.getElementById('ferias-militar').value = '';
                    document.getElementById('ferias-inicio').value = '';
                    document.getElementById('ferias-fim').value = '';
                } else if (infoType === 'licencas') {
                    document.getElementById('licenca-militar').value = '';
                    document.getElementById('licenca-inicio').value = '';
                    document.getElementById('licenca-fim').value = '';
                } else if (infoType === 'expediente') {
                    document.getElementById('expediente-texto').value = '';
                }
                
                alert('Item adicionado com sucesso!');
            }
        }
    } catch (error) {
        console.error('Erro ao adicionar item:', error);
        alert('Erro ao adicionar item. Tente novamente.');
    }
}

// Mostrar botões de remoção para cada item
function showInfoRemoveButtons(infoType, section) {
    const container = section.querySelector('.info-list');
    if (!container) return;
    
    // Obter itens
    const items = JSON.parse(localStorage.getItem(`info_${infoType}`) || '[]');
    
    // Limpar o container
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<li class="info-item">Nenhuma informação cadastrada.</li>';
        return;
    }
    
    // Adicionar cada item com botão de remoção
    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'info-item';
        li.innerHTML = `
            <div class="info-text">${item}</div>
            <button class="info-remove-btn" data-type="${infoType}" data-index="${index}">🗑️</button>
        `;
        container.appendChild(li);
    });
    
    // Adicionar eventos aos botões de remoção
    container.querySelectorAll('.info-remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const index = parseInt(this.getAttribute('data-index'));
            removeInfoItem(type, index);
        });
    });
}

// Remover um item
function removeInfoItem(infoType, index) {
    try {
        const items = JSON.parse(localStorage.getItem(`info_${infoType}`) || '[]');
        
        if (index < 0 || index >= items.length) {
            console.error('Índice inválido para remoção');
            return;
        }
        
        const item = items[index];
        
        if (confirm(`Tem certeza que deseja remover este item?`)) {
            // Remover item
            items.splice(index, 1);
            localStorage.setItem(`info_${infoType}`, JSON.stringify(items));
            
            // Atualizar a interface
            const section = document.querySelector(`.box-${infoType}`);
            if (section) {
                if (section.classList.contains('edit-mode')) {
                    showInfoRemoveButtons(infoType, section);
                } else {
                    updateInfoItems(infoType, section);
                }
                
                alert('Item removido com sucesso!');
            }
        }
    } catch (error) {
        console.error('Erro ao remover item:', error);
        alert('Erro ao remover item. Tente novamente.');
    }
}

// Atualizar itens (modo normal, sem botões de remoção)
function updateInfoItems(infoType, section) {
    const container = section.querySelector('.info-list');
    if (!container) return;
    
    // Obter itens
    const items = JSON.parse(localStorage.getItem(`info_${infoType}`) || '[]');
    
    // Limpar o container
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<li class="info-item">Nenhuma informação cadastrada.</li>';
        return;
    }
    
    // Adicionar cada item
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'info-item';
        li.textContent = item;
        container.appendChild(li);
    });
}

// Função auxiliar para formatar data (YYYY-MM-DD para DD/MM/YYYY)
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para ordenar militares por hierarquia
function sortMilitariesByRank(militaries) {
    // Evitar duplicados
    const uniqueMilitaries = [...new Set(militaries)];
    
    // Ordenação de patentes/graduações
    const rankOrder = {
        'CEL PM': 1,
        'TC PM': 2,
        'MAJ PM': 3,
        'CAP PM': 4,
        '1º TEN PM': 5,
        '2º TEN PM': 6,
        'ASP OF PM': 7,
        'SUB TEN PM': 8,
        '1º SGT PM': 9,
        '2º SGT PM': 10,
        '3º SGT PM': 11,
        'CB PM': 12,
        'SD PM': 13
    };

    return uniqueMilitaries.sort((a, b) => {
        // Extrair patente/graduação do nome do militar
        const getRank = (name) => {
            for (const rank in rankOrder) {
                if (name.includes(rank)) {
                    return rankOrder[rank];
                }
            }
            return 99; // Padrão para não identificados
        };

        const rankA = getRank(a);
        const rankB = getRank(b);
        
        return rankA - rankB;
    });
}

// Adicionar estilos específicos para o editor
function addInfoEditorStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilo para o modo de edição */
        .edit-mode .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            transition: all 0.2s ease;
        }
        
        .edit-mode .info-item:hover {
            background-color: #f1f5f9;
        }
        
        /* Botão de remoção */
        .info-remove-btn {
            background-color: #ef4444;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.2s ease;
        }
        
        .info-remove-btn:hover {
            background-color: #b91c1c;
        }
        
        /* Botão de edição/salvar */
        .edit-btn {
            padding: 5px 10px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            margin-left: 10px;
            font-size: 0.8rem;
            background-color: #3b82f6;
            color: white;
        }
        
        .edit-btn.save-btn {
            background-color: #10b981;
        }
        
        /* Formulário de adição */
        .info-add-form {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #e2e8f0;
        }
        
        .form-title {
            font-weight: bold;
            margin-bottom: 15px;
            color: #1e3a8a;
        }
        
        .form-content {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .form-field {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .form-field label {
            font-weight: 500;
            color: #4b5563;
        }
        
        .info-select, .info-date, .info-text {
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            width: 100%;
        }
        
        .info-add-btn {
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 12px;
            cursor: pointer;
            align-self: flex-end;
            margin-top: 10px;
        }
        
        .info-add-btn:hover {
            background-color: #2563eb;
        }
        
        /* Títulos das seções com botão de edição */
        .info-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
    `;
    document.head.appendChild(style);
}

// Inicializar dados padrão se necessário
function initializeDefaultInfoData() {
    // Férias
    if (!localStorage.getItem('info_ferias')) {
        const ferias = [
            "SGT RODRIGO - Férias de 01/06/2025 até 30/06/2025",
            "CB FELIPE - Férias de 15/07/2025 até 15/08/2025"
        ];
        localStorage.setItem('info_ferias', JSON.stringify(ferias));
    }
    
    // Licenças
    if (!localStorage.getItem('info_licencas')) {
        const licencas = [
            "SD CHAGAS - Licença Saúde de 05/04/2025 até 20/04/2025",
            "SGT ANA CLEIDE - Licença Prêmio de 01/08/2025 até 01/09/2025"
        ];
        localStorage.setItem('info_licencas', JSON.stringify(licencas));
    }
    
    // Expediente
    if (!localStorage.getItem('info_expediente')) {
        const expediente = [
            "Reunião de comando toda segunda-feira às 08:00",
            "Educação física para oficiais e praças às quartas-feiras",
            "Expediente administrativo das 08:00 às 14:00"
        ];
        localStorage.setItem('info_expediente', JSON.stringify(expediente));
    }
}

// Adicionar botões de edição às seções de informações
function addInfoEditButtons() {
    const infoTypes = ['ferias', 'licencas', 'expediente'];
    
    infoTypes.forEach(type => {
        const titleContainer = document.querySelector(`.box-${type} .info-title`);
        if (titleContainer) {
            // Verificar se o botão já existe
            let editBtn = titleContainer.querySelector('.edit-btn');
            if (!editBtn) {
                editBtn = document.createElement('button');
                editBtn.className = 'edit-btn admin-only';
                editBtn.style.display = 'none'; // Será mostrado pelo auth.js se o usuário for admin
                editBtn.textContent = "✏️ Editar";
                editBtn.setAttribute('data-type', type);
                
                editBtn.addEventListener('click', function() {
                    const infoType = this.getAttribute('data-type');
                    openInfoModal(infoType);
                });
                
                titleContainer.appendChild(editBtn);
            }
        }
    });
}

// Inicializar o sistema de edição
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('escalas.html')) {
        console.log('Inicializando sistema de edição de informações na página de escalas');
        
        // Inicializar dados padrão se necessário
        initializeDefaultInfoData();
        
        // Adicionar estilos CSS
        addInfoEditorStyles();
        
        // Adicionar botões de edição
        addInfoEditButtons();
        
        // Certificar-se de que os dados atuais estão sendo exibidos
        const infoTypes = ['ferias', 'licencas', 'expediente'];
        infoTypes.forEach(type => {
            const section = document.querySelector(`.box-${type}`);
            if (section) {
                updateInfoItems(type, section);
            }
        });
    }
});