// Script para adicionar edição direta de equipes no próprio index.html

// Dados iniciais das equipes
const defaultTeams = {
    alfa: [
        "2º SGT PM PEIXOTO",
        "3º SGT PM RODRIGO",
        "3º SGT PM LEDO",
        "3º SGT PM NUNES",
        "3º SGT PM AMARAL",
        "CB PM CARLA",
        "CB PM FELIPE",
        "CB PM BARROS",
        "CB PM A. SILVA",
        "SD PM LUAN",
        "SD PM NAVARRO"
    ],
    bravo: [
        "1º SGT PM OLIMAR",
        "2º SGT PM FÁBIO",
        "3º SGT PM ANA CLEIDE",
        "3º SGT PM GLEIDSON",
        "3º SGT PM CARLOS EDUARDO",
        "3º SGT PM NEGRÃO",
        "CB PM BRASIL",
        "SD PM MARVÃO",
        "SD PM IDELVAN"
    ],
    charlie: [
        "2º SGT PM PINHEIRO",
        "3º SGT PM RAFAEL",
        "CB PM MIQUEIAS",
        "CB PM M. PAIXÃO",
        "SD PM CHAGAS",
        "SD PM CARVALHO",
        "SD PM GOVEIA",
        "SD PM ALMEIDA",
        "SD PM PATRIK",
        "SD PM GUIMARÃES"
    ]
};

// Lista completa de todos os militares
const allMilitaryDatabase = [
    "1º SGT PM OLIMAR",
    "2º SGT PM PINHEIRO",
    "2º SGT PM PEIXOTO",
    "2º SGT PM FÁBIO",
    "3º SGT PM RODRIGO",
    "3º SGT PM LEDO",
    "3º SGT PM NUNES",
    "3º SGT PM AMARAL",
    "3º SGT PM ANA CLEIDE",
    "3º SGT PM GLEIDSON",
    "3º SGT PM CARLOS EDUARDO",
    "3º SGT PM NEGRÃO",
    "3º SGT PM RAFAEL",
    "CB PM BRASIL",
    "CB PM CARLA",
    "CB PM FELIPE",
    "CB PM BARROS",
    "CB PM A. SILVA",
    "CB PM MIQUEIAS",
    "CB PM M. PAIXÃO",
    "SD PM MARVÃO",
    "SD PM IDELVAN",
    "SD PM LUAN",
    "SD PM NAVARRO",
    "SD PM CHAGAS",
    "SD PM CARVALHO",
    "SD PM GOVEIA",
    "SD PM ALMEIDA",
    "SD PM PATRIK",
    "SD PM GUIMARÃES"
];

// Inicializar dados padrão se necessário
function initializeDefaultTeamData() {
    for (const team in defaultTeams) {
        if (!localStorage.getItem(`equipe_${team}`)) {
            localStorage.setItem(`equipe_${team}`, JSON.stringify(defaultTeams[team]));
        }
    }
}

// Adicionar estilos CSS para o editor de equipes
function addEditorStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* Estilos para o editor inline */
        .edit-mode .equipe-membro {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
        }
        
        .edit-mode .equipe-membro .btn-remove {
            display: inline-flex;
            align-items: center;
            background-color: #ef4444;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 3px 8px;
            cursor: pointer;
            font-size: 0.85rem;
            margin-left: 10px;
        }
        
        .edit-mode .equipe-membro .btn-remove:before {
            content: "🗑️";
            margin-right: 3px;
        }
        
        .btn-edit-mode {
            background: linear-gradient(to right, #ef4444, #dc2626);
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-left: 10px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-edit-mode:before {
            content: "✏️";
        }
        
        .btn-save-mode {
            background: linear-gradient(to right, #10b981, #059669);
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-left: 10px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .btn-save-mode:before {
            content: "💾";
        }
        
        .team-editor-form {
            margin-top: 15px;
            padding: 10px;
            background-color: #f1f5f9;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .team-editor-form h4 {
            margin-top: 0;
            margin-bottom: 10px;
            color: #1e3a8a;
        }
        
        .team-editor-form select, 
        .team-editor-form input {
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
        }
        
        .team-editor-form button {
            padding: 8px 12px;
            background-color: #1e3a8a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .team-editor-form .btn-add-member {
            background: linear-gradient(to right, #1e3a8a, #3949ab);
        }
        
        .available-militaries {
            margin-top: 5px;
        }
        
        /* Destacar botão de edição nas seções de equipe */
        .equipe-section .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    `;
    document.head.appendChild(style);
}

// Ativar modo de edição para uma equipe
function toggleEditMode(team) {
    const section = document.querySelector(`.equipe-${team}`);
    if (!section) return;
    
    if (section.classList.contains('edit-mode')) {
        // Desativar modo de edição
        section.classList.remove('edit-mode');
        const editBtn = section.querySelector('.btn-edit-mode, .btn-save-mode');
        if (editBtn) {
            editBtn.className = 'btn-edit-mode';
            editBtn.textContent = ' Editar';
            editBtn.setAttribute('data-mode', 'edit');
        }
        
        const editorForm = section.querySelector('.team-editor-form');
        if (editorForm) {
            editorForm.style.display = 'none';
        }
        
        // Remover botões de remoção
        section.querySelectorAll('.btn-remove').forEach(btn => btn.remove());
        
        // Voltar ao formato padrão da lista
        updateEquipeMembers(team);
    } else {
        // Ativar modo de edição
        section.classList.add('edit-mode');
        const editBtn = section.querySelector('.btn-edit-mode');
        if (editBtn) {
            editBtn.className = 'btn-save-mode';
            editBtn.textContent = ' Salvar';
            editBtn.setAttribute('data-mode', 'save');
        }
        
        // Mostrar formulário de adição
        showTeamEditorForm(team);
        
        // Adicionar botões de remoção para cada membro
        updateEquipeMembersWithRemoveButtons(team);
    }
}

// Mostrar formulário de edição da equipe
function showTeamEditorForm(team) {
    const section = document.querySelector(`.equipe-${team}`);
    if (!section) return;
    
    // Verificar se o formulário já existe
    let editorForm = section.querySelector('.team-editor-form');
    
    if (!editorForm) {
        editorForm = document.createElement('div');
        editorForm.className = 'team-editor-form';
        
        // Obter todos os militares já alocados
        const alfa = JSON.parse(localStorage.getItem('equipe_alfa')) || [];
        const bravo = JSON.parse(localStorage.getItem('equipe_bravo')) || [];
        const charlie = JSON.parse(localStorage.getItem('equipe_charlie')) || [];
        
        // Combinar todas as equipes para ver quem já está alocado
        const allocatedMilitaries = [...alfa, ...bravo, ...charlie];
        
        // Militares ainda não alocados
        const availableMilitaries = allMilitaryDatabase.filter(
            military => !allocatedMilitaries.includes(military)
        );
        
        const teamContainer = section.querySelector('.equipe-membros');
        if (teamContainer) {
            editorForm.innerHTML = `
                <h4>Adicionar Militar</h4>
                
                <select id="${team}-military-select">
                    <option value="">-- Selecione um militar --</option>
                    ${availableMilitaries.map(military => 
                        `<option value="${military}">${military}</option>`
                    ).join('')}
                </select>
                
                <button class="btn-add-member" data-team="${team}">Adicionar à Equipe</button>
            `;
            
            // Inserir antes da lista de membros
            teamContainer.parentNode.insertBefore(editorForm, teamContainer);
            
            // Adicionar evento ao botão de adicionar
            const addBtn = editorForm.querySelector('.btn-add-member');
            addBtn.addEventListener('click', function() {
                const select = document.getElementById(`${team}-military-select`);
                if (!select.value) {
                    alert('Por favor, selecione um militar');
                    return;
                }
                
                addMilitaryToTeam(select.value, team);
                
                // Atualizar a lista e o formulário
                updateEquipeMembersWithRemoveButtons(team);
                showTeamEditorForm(team); // Atualizar o formulário para remover o militar selecionado
            });
        }
    } else {
        editorForm.style.display = 'block';
    }
}

// Adicionar botões de remoção para cada membro de uma equipe
function updateEquipeMembersWithRemoveButtons(team) {
    const container = document.querySelector(`.equipe-${team} .equipe-membros`);
    if (!container) return;
    
    const members = JSON.parse(localStorage.getItem(`equipe_${team}`)) || [];
    container.innerHTML = '';
    
    members.forEach((member, index) => {
        const li = document.createElement('li');
        li.className = 'equipe-membro';
        li.innerHTML = `
            <strong>${member}</strong>
            <button class="btn-remove" data-team="${team}" data-index="${index}">Remover</button>
        `;
        container.appendChild(li);
    });
    
    // Adicionar eventos para os botões de remover
    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            removeMemberFromTeam(this.dataset.team, parseInt(this.dataset.index));
        });
    });
}

// Atualizar a lista de membros da equipe (modo normal)
function updateEquipeMembers(team) {
    const container = document.querySelector(`.equipe-${team} .equipe-membros`);
    if (!container) return;
    
    const members = JSON.parse(localStorage.getItem(`equipe_${team}`)) || [];
    container.innerHTML = '';
    
    members.forEach(member => {
        const li = document.createElement('li');
        li.className = 'equipe-membro';
        li.innerHTML = `<strong>${member}</strong>`;
        container.appendChild(li);
    });
    
    // Atualizar título com o número de policiais
    updateTeamTitle(team, members.length);
}

// Atualizar título da equipe com o número correto de policiais
function updateTeamTitle(team, memberCount) {
    const title = document.querySelector(`.equipe-${team} .equipe-title`);
    if (title) {
        const titleText = title.textContent;
        // Usar regex para substituir o número entre parênteses
        const updatedText = titleText.replace(/\(\d+\s+Policiais\)/, `(${memberCount} Policiais)`);
        
        // Preservar apenas o botão de edição, se existir
        const editBtn = title.querySelector('.btn-edit-mode, .btn-save-mode');
        
        title.innerHTML = ''; // Limpar o título
        
        // Adicionar badge
        const badge = document.createElement('span');
        badge.className = `equipe-title-badge badge-${team}`;
        badge.textContent = team.toUpperCase();
        title.appendChild(badge);
        
        // Adicionar texto atualizado
        const textNode = document.createTextNode(` Equipe ${team.charAt(0).toUpperCase() + team.slice(1)} (${memberCount} Policiais)`);
        title.appendChild(textNode);
        
        // Re-adicionar botão de edição se existir
        if (editBtn) {
            title.appendChild(editBtn);
        }
    }
}

// Adicionar um militar a uma equipe
function addMilitaryToTeam(military, team) {
    try {
        // Obter todos os militares já alocados em outras equipes
        const otherTeams = ['alfa', 'bravo', 'charlie'].filter(t => t !== team);
        let isInOtherTeam = false;
        
        for (const otherTeam of otherTeams) {
            const otherMembers = JSON.parse(localStorage.getItem(`equipe_${otherTeam}`)) || [];
            const index = otherMembers.indexOf(military);
            
            if (index !== -1) {
                if (confirm(`Este militar já está na equipe ${otherTeam.toUpperCase()}. Deseja transferi-lo para a equipe ${team.toUpperCase()}?`)) {
                    // Remover da outra equipe
                    otherMembers.splice(index, 1);
                    localStorage.setItem(`equipe_${otherTeam}`, JSON.stringify(otherMembers));
                    
                    // Atualizar a interface da outra equipe
                    updateEquipeMembers(otherTeam);
                } else {
                    return;
                }
                isInOtherTeam = true;
                break;
            }
        }
        
        // Adicionar à equipe selecionada
        const members = JSON.parse(localStorage.getItem(`equipe_${team}`)) || [];
        
        if (members.includes(military)) {
            alert(`Este militar já está na equipe ${team.toUpperCase()}.`);
            return;
        }
        
        members.push(military);
        localStorage.setItem(`equipe_${team}`, JSON.stringify(members));
        
        // Atualizar interface com os botões de remoção
        updateEquipeMembersWithRemoveButtons(team);
        
        if (!isInOtherTeam) {
            alert(`Militar adicionado com sucesso à equipe ${team.toUpperCase()}.`);
        }
    } catch (error) {
        console.error(`Erro ao adicionar militar à equipe ${team}:`, error);
        alert('Erro ao adicionar militar. Tente novamente.');
    }
}

// Remover um militar de uma equipe
function removeMemberFromTeam(team, index) {
    try {
        const members = JSON.parse(localStorage.getItem(`equipe_${team}`)) || [];
        const removedMilitary = members[index];
        
        if (confirm(`Tem certeza que deseja remover ${removedMilitary} da equipe ${team.toUpperCase()}?`)) {
            // Remover da equipe
            members.splice(index, 1);
            localStorage.setItem(`equipe_${team}`, JSON.stringify(members));
            
            // Atualizar interface
            updateEquipeMembersWithRemoveButtons(team);
            
            alert(`Militar removido com sucesso da equipe ${team.toUpperCase()}.`);
        }
    } catch (error) {
        console.error(`Erro ao remover membro da equipe ${team}:`, error);
        alert('Erro ao remover militar. Tente novamente.');
    }
}

// Adicionar botões de edição às seções de equipe
function addEditButtonsToTeams() {
    const teams = ['alfa', 'bravo', 'charlie'];
    
    teams.forEach(team => {
        const title = document.querySelector(`.equipe-${team} .equipe-title`);
        if (title) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-edit-mode';
            editBtn.textContent = ' Editar';
            editBtn.setAttribute('data-team', team);
            editBtn.setAttribute('data-mode', 'edit');
            
            editBtn.addEventListener('click', function() {
                const team = this.getAttribute('data-team');
                toggleEditMode(team);
            });
            
            title.appendChild(editBtn);
        }
    });
}

// Inicializar o editor de equipes
function initTeamEditor() {
    console.log("Inicializando editor de equipes inline");
    
    // Inicializar dados padrão se necessário
    initializeDefaultTeamData();
    
    // Adicionar estilos CSS
    addEditorStyles();
    
    // Adicionar botões de edição
    addEditButtonsToTeams();
    
    // Carregar dados das equipes
    const teams = ['alfa', 'bravo', 'charlie'];
    teams.forEach(team => updateEquipeMembers(team));
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está autenticado
    if (typeof checkGlobalAuth === 'function') {
        if (checkGlobalAuth()) {
            initTeamEditor();
        } else {
            console.log("Usuário não autenticado, editor de equipes não será inicializado");
        }
    } else {
        console.log("Função checkGlobalAuth não encontrada, editor de equipes não será inicializado");
    }
});