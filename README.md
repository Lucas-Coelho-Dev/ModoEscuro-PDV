# PDVNet - Modo Escuro (Extensão Local)

Extensão local para o Google Chrome que ativa o modo escuro automaticamente na plataforma **PDVNet Chamados** (`app.pdvnet.com.br`), proporcionando uma experiência visual moderna, elegante e confortável para os olhos durante o trabalho.

---

## 🚀 Como Funciona

A extensão funciona de forma **100% local e híbrida**:
1. **CSS Declarativo**: Aplica uma folha de estilos personalizada (`styles.css`) para escurecer as tabelas, formulários e o fundo da página, preservando o zebra striping e as cores da marca (roxo original).
2. **Engine Dinâmica (JS)**: Um script em JavaScript (`content.js`) monitora o carregamento de dados em tempo real. Ele analisa as cores computadas exibidas na tela e inverte automaticamente qualquer fundo claro (branco) e texto escuro (preto), garantindo que até os elementos carregados dinamicamente fiquem em modo escuro.

---

## 🛠️ Como Instalar no Google Chrome

Siga o passo a passo abaixo para rodar a extensão localmente:

1. **Baixe ou clone este repositório**:
   - Faça o clone do repositório ou baixe os arquivos em uma pasta no seu computador.

2. **Abra a página de Extensões do Chrome**:
   - Abra o navegador Google Chrome.
   - Acesse o endereço `chrome://extensions/` na barra de navegação.

3. **Ative o Modo do Desenvolvedor**:
   - Ative a chave **Modo do desenvolvedor** (Developer mode) no canto superior direito da página.

4. **Carregue a extensão**:
   - No canto superior esquerdo, clique no botão **Carregar sem compactação** (Load unpacked).
   - Selecione a pasta onde os arquivos deste repositório estão salvos.
   - Clique em **Selecionar pasta**.

5. **Pronto!**:
   - Acesse [app.pdvnet.com.br/app/Chamado](https://app.pdvnet.com.br/app/Chamado). A plataforma carregará automaticamente com o tema escuro aplicado.

---

## 🔄 Como Atualizar

Se você fizer novos ajustes no código do CSS ou JS:
1. Vá até `chrome://extensions/`.
2. Clique no ícone de **atualizar** (seta circular) no card da extensão **PDVNet Dark Theme**.
3. Atualize a aba da PDVNet pressionando **F5**.

---

## 📝 Autor

Desenvolvido por **[Lucas Coelho](https://github.com/Lucas-Coelho-Dev)**.
