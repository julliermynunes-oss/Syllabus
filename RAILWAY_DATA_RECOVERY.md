# Recuperação e Prevenção de Perda de Dados no Railway

## O que aconteceu?

Quando você altera o domínio no Railway, às vezes o serviço pode ser recriado ou o volume pode ser desvinculado. Isso faz com que o banco de dados volte para o caminho padrão (ephemeral) e os dados sejam perdidos.

## Como verificar e corrigir agora:

### 1. Verificar se o Volume está vinculado

1. No Railway, vá para seu projeto
2. Clique no serviço (Service)
3. Vá na aba **"Volumes"** (ou **"Settings"** → **"Volumes"**)
4. Verifique se há um volume criado e vinculado ao seu serviço

### 2. Verificar a variável de ambiente DB_PATH

1. No Railway, vá para seu serviço
2. Clique na aba **"Variables"**
3. Procure pela variável `DB_PATH`
4. Ela deve estar assim:
   ```
   DB_PATH=/data/syllabus.db
   ```
   (O caminho `/data/` é onde o volume é montado no Railway)

### 3. Se o volume não estiver vinculado:

1. Na aba **"Volumes"** do seu serviço
2. Clique em **"New Volume"**
3. Nomeie como `data` (ou outro nome de sua preferência)
4. O caminho do mount deve ser `/data`
5. Clique em **"Add"**

### 4. Configurar a variável DB_PATH

1. Na aba **"Variables"**
2. Se não existir `DB_PATH`, adicione:
   - **Name:** `DB_PATH`
   - **Value:** `/data/syllabus.db`
3. Salve

### 5. Redeploy

Após configurar o volume e a variável, o Railway deve fazer o redeploy automaticamente. Se não fizer:
1. Vá na aba **"Deployments"**
2. Clique nos três pontos do último deployment
3. Selecione **"Redeploy"**

## Prevenção futura:

### Backup manual (opcional):

Você pode criar um endpoint de backup no servidor para fazer download do banco de dados periodicamente.

### Importante:

- **Sempre verifique** se o volume está vinculado antes de fazer mudanças no domínio
- **Anote** o nome do volume para reutilizar se necessário
- Se precisar criar um **novo serviço**, certifique-se de criar e vincular o volume **antes** de começar a usar o sistema

## Se os dados foram perdidos:

Infelizmente, se o volume foi desvinculado e você já criou novos dados, os dados antigos não podem ser recuperados a menos que você tenha um backup.

Para evitar isso no futuro, siga sempre os passos acima antes de alterar configurações importantes no Railway.

