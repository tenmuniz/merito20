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