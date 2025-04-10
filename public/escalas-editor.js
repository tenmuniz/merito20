// Script para edição direta de equipes na página escalas.html

// Dados iniciais das equipes (será usado apenas se não houver dados no localStorage)
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

// Sobrescrever a função openEquipeModal
function openEquipeModal(equipe) {
    console.log("Abrindo edição direta para equipe:", equipe);
    
    // Iniciar modo de edição para a equipe diretamente na página
    const section = document.querySelector(`.equipe-${equipe}`);
    if (!section) return;
    
    // Verificar se já está em modo de edição
    if (section.classList.contains('edit-mode')) {
        // Sair do modo de edição
        exitEditMode(equipe);
    } else {
        // Entrar em modo de edição
        enterEditMode(equipe);
    }
}

// Entrar em modo de edição para a equipe
function enterEditMode(equipe) {
    const section = document.querySelector(`.equipe-${equipe}`);
    if (!section) return;
    
    // Adicionar classe de modo de edição
    section.classList.add('edit-mode');
    
    // Mudar o botão de editar para salvar
    const editBtn = document.getElementById(`editEquipe${equipe.charAt(0).toUpperCase() + equipe.slice(1)}Btn`);
    if (editBtn) {
        editBtn.textContent = "💾 Salvar";
        editBtn.classList.add('save-btn');
    }
    
    // Mostrar formulário de adição de membros
    showAddMemberForm(equipe, section);
    
    // Mostrar botões de remoção para cada membro
    showRemoveButtons(equipe);
}

// Sair do modo de edição para a equipe
function exitEditMode(equipe) {
    const section = document.querySelector(`.equipe-${equipe}`);
    if (!section) return;
    
    // Remover classe de modo de edição
    section.classList.remove('edit-mode');
    
    // Mudar o botão de salvar para editar
    const editBtn = document.getElementById(`editEquipe${equipe.charAt(0).toUpperCase() + equipe.slice(1)}Btn`);
    if (editBtn) {
        editBtn.textContent = "✏️ Editar";
        editBtn.classList.remove('save-btn');
    }
    
    // Remover formulário de adição
    const addForm = section.querySelector('.add-member-form');
    if (addForm) {
        addForm.remove();
    }
    
    // Atualizar a lista de membros (remover botões de exclusão)
    updateTeamMembers(equipe);
}

// Mostrar formulário de adição de membros
function showAddMemberForm(equipe, section) {
    // Obter o container onde fica a lista de membros
    const membersContainer = section.querySelector('.equipe-membros');
    if (!membersContainer) return;
    
    // Verificar se o formulário já existe
    let addForm = section.querySelector('.add-member-form');
    
    if (!addForm) {
        // Criar formulário de adição
        addForm = document.createElement('div');
        addForm.className = 'add-member-form';
        
        // Listar os militares disponíveis (não alocados em outras equipes)
        const availableMilitaries = getAvailableMilitaries();
        
        // Montar o HTML do formulário
        addForm.innerHTML = `
            <div class="form-title">Adicionar Militar à Equipe ${equipe.toUpperCase()}</div>
            <div class="form-content">
                <select id="add-member-${equipe}" class="member-select">
                    <option value="">Selecione um militar</option>
                    ${availableMilitaries.map(mil => `<option value="${mil}">${mil}</option>`).join('')}
                </select>
                <button class="add-member-btn" data-team="${equipe}">Adicionar</button>
            </div>
        `;
        
        // Adicionar antes da lista de membros
        membersContainer.parentNode.insertBefore(addForm, membersContainer);
        
        // Adicionar evento ao botão de adicionar membro
        const addBtn = addForm.querySelector('.add-member-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                const select = document.getElementById(`add-member-${equipe}`);
                if (select && select.value) {
                    addMemberToTeam(select.value, equipe);
                    
                    // Atualizar lista de membros com botões de remoção
                    showRemoveButtons(equipe);
                    
                    // Atualizar o formulário com a lista atualizada de militares disponíveis
                    const newAvailableMilitaries = getAvailableMilitaries();
                    select.innerHTML = `
                        <option value="">Selecione um militar</option>
                        ${newAvailableMilitaries.map(mil => `<option value="${mil}">${mil}</option>`).join('')}
                    `;
                } else {
                    alert('Por favor, selecione um militar para adicionar.');
                }
            });
        }
    } else {
        // Mostrar o formulário se estiver escondido
        addForm.style.display = 'block';
    }
}

// Obter militares disponíveis (não alocados em nenhuma equipe)
function getAvailableMilitaries() {
    // Obter todos os militares já alocados
    const alfa = JSON.parse(localStorage.getItem('equipe_alfa')) || [];
    const bravo = JSON.parse(localStorage.getItem('equipe_bravo')) || [];
    const charlie = JSON.parse(localStorage.getItem('equipe_charlie')) || [];
    
    // Combinar todas as equipes para ver quem já está alocado
    const allocatedMilitaries = [...alfa, ...bravo, ...charlie];
    
    // Militares ainda não alocados
    return allMilitaryDatabase.filter(
        military => !allocatedMilitaries.includes(military)
    ).sort();
}

// Mostrar botões de remoção para cada membro
function showRemoveButtons(equipe) {
    const container = document.querySelector(`.equipe-${equipe} .equipe-membros`);
    if (!container) return;
    
    // Obter membros da equipe
    const members = JSON.parse(localStorage.getItem(`equipe_${equipe}`)) || [];
    
    // Limpar o container
    container.innerHTML = '';
    
    // Adicionar cada membro com botão de remoção
    members.forEach((member, index) => {
        const li = document.createElement('li');
        li.className = 'equipe-membro';
        li.innerHTML = `
            <div class="membro-info">
                <strong>${member}</strong>
            </div>
            <button class="remove-member-btn" data-team="${equipe}" data-index="${index}">🗑️ Remover</button>
        `;
        container.appendChild(li);
    });
    
    // Adicionar eventos aos botões de remoção
    container.querySelectorAll('.remove-member-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const team = this.getAttribute('data-team');
            const index = parseInt(this.getAttribute('data-index'));
            removeMemberFromTeam(team, index);
            
            // Atualizar a lista de membros com botões de remoção
            showRemoveButtons(team);
            
            // Atualizar o formulário de adição com a nova lista de militares disponíveis
            updateAddMemberForm(team);
        });
    });
}

// Atualizar formulário de adição de membros com a lista atualizada de militares
function updateAddMemberForm(equipe) {
    const select = document.getElementById(`add-member-${equipe}`);
    if (select) {
        const availableMilitaries = getAvailableMilitaries();
        select.innerHTML = `
            <option value="">Selecione um militar</option>
            ${availableMilitaries.map(mil => `<option value="${mil}">${mil}</option>`).join('')}
        `;
    }
}

// Adicionar um militar a uma equipe
function addMemberToTeam(military, team) {
    try {
        // Verificar se o militar existe no banco de dados
        if (!allMilitaryDatabase.includes(military)) {
            allMilitaryDatabase.push(military);
        }
        
        // Verificar se o militar já está em outra equipe
        const otherTeams = ['alfa', 'bravo', 'charlie'].filter(t => t !== team);
        
        for (const otherTeam of otherTeams) {
            const otherMembers = JSON.parse(localStorage.getItem(`equipe_${otherTeam}`)) || [];
            const index = otherMembers.indexOf(military);
            
            if (index !== -1) {
                if (confirm(`Este militar já está na equipe ${otherTeam.toUpperCase()}. Deseja transferi-lo para a equipe ${team.toUpperCase()}?`)) {
                    // Remover da outra equipe
                    otherMembers.splice(index, 1);
                    localStorage.setItem(`equipe_${otherTeam}`, JSON.stringify(otherMembers));
                    
                    // Atualizar a interface da outra equipe se estiver em modo de edição
                    const otherSection = document.querySelector(`.equipe-${otherTeam}`);
                    if (otherSection && otherSection.classList.contains('edit-mode')) {
                        showRemoveButtons(otherTeam);
                        updateAddMemberForm(otherTeam);
                    } else {
                        updateTeamMembers(otherTeam);
                    }
                } else {
                    return; // Cancelou a transferência
                }
                break;
            }
        }
        
        // Adicionar à equipe
        const members = JSON.parse(localStorage.getItem(`equipe_${team}`)) || [];
        
        // Verificar se já está na equipe
        if (members.includes(military)) {
            alert(`Este militar já está na equipe ${team.toUpperCase()}.`);
            return;
        }
        
        members.push(military);
        localStorage.setItem(`equipe_${team}`, JSON.stringify(members));
        
        // Atualizar o contador de militares na equipe
        updateTeamCount(team, members.length);
        
    } catch (error) {
        console.error('Erro ao adicionar militar:', error);
        alert('Erro ao adicionar militar. Tente novamente.');
    }
}

// Remover um militar de uma equipe
function removeMemberFromTeam(team, index) {
    try {
        const members = JSON.parse(localStorage.getItem(`equipe_${team}`)) || [];
        
        if (index < 0 || index >= members.length) {
            console.error('Índice inválido para remoção');
            return;
        }
        
        const military = members[index];
        
        if (confirm(`Tem certeza que deseja remover ${military} da equipe ${team.toUpperCase()}?`)) {
            // Remover militar
            members.splice(index, 1);
            localStorage.setItem(`equipe_${team}`, JSON.stringify(members));
            
            // Atualizar o contador de militares na equipe
            updateTeamCount(team, members.length);
        }
    } catch (error) {
        console.error('Erro ao remover militar:', error);
        alert('Erro ao remover militar. Tente novamente.');
    }
}

// Atualizar contador de militares na equipe
function updateTeamCount(team, count) {
    const title = document.querySelector(`.equipe-${team} .equipe-title`);
    if (title) {
        // Atualizar o texto que mostra o número de militares
        const titleText = title.textContent;
        const updatedText = titleText.replace(/\(\d+\s+Policiais\)/, `(${count} Policiais)`);
        
        // Substitui apenas a parte do texto, mantendo elementos filhos (como o botão de edição)
        const childNodes = Array.from(title.childNodes);
        for (let i = 0; i < childNodes.length; i++) {
            if (childNodes[i].nodeType === Node.TEXT_NODE) {
                childNodes[i].textContent = updatedText;
                break;
            }
        }
    }
}

// Atualizar membros da equipe (modo normal, sem botões de remoção)
function updateTeamMembers(team) {
    const container = document.querySelector(`.equipe-${team} .equipe-membros`);
    if (!container) return;
    
    const members = JSON.parse(localStorage.getItem(`equipe_${team}`)) || [];
    
    // Limpar o container
    container.innerHTML = '';
    
    // Adicionar cada membro
    members.forEach(member => {
        const li = document.createElement('li');
        li.className = 'equipe-membro';
        li.innerHTML = `<strong>${member}</strong>`;
        container.appendChild(li);
    });
    
    // Atualizar o contador de militares na equipe
    updateTeamCount(team, members.length);
}

// Adicionar estilos específicos para o editor
function addEditorStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Estilo para o modo de edição */
        .edit-mode .equipe-membro {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #f1f5f9;
            border: 1px solid #e2e8f0;
            padding: 10px;
            transition: all 0.2s ease;
        }
        
        .edit-mode .equipe-membro:hover {
            background-color: #e2e8f0;
        }
        
        .edit-mode .equipe-membros {
            columns: 1 !important;
        }
        
        /* Botão de remoção */
        .remove-member-btn {
            background-color: #ef4444;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.2s ease;
        }
        
        .remove-member-btn:hover {
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
        .add-member-form {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid #e2e8f0;
        }
        
        .form-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #1e3a8a;
        }
        
        .form-content {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .member-select {
            flex-grow: 1;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
        }
        
        .add-member-btn {
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 12px;
            cursor: pointer;
        }
        
        .add-member-btn:hover {
            background-color: #2563eb;
        }
    `;
    document.head.appendChild(style);
}

// Inicializar o sistema de edição na página escalas.html
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('escalas.html')) {
        console.log('Inicializando sistema de edição na página de escalas');
        
        // Inicializar dados padrão se necessário
        initializeDefaultTeamData();
        
        // Adicionar estilos CSS
        addEditorStyles();
        
        // Substituir a função original de openEquipeModal 
        // (isso acontece automaticamente quando este script é carregado)
        
        // Certificar-se de que os dados atuais estão sendo exibidos
        const teams = ['alfa', 'bravo', 'charlie'];
        teams.forEach(updateTeamMembers);
    }
});