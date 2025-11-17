const DB_PATH = path.join(__dirname, 'db.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = 'gabrielpasini';
const GITHUB_REPO_NAME = 'roleta-smart-tv';

const CONTENT_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${DB_PATH}`;

/**
 * Faz o commit do novo conteúdo JSON para o GitHub.
 * @param {object} newDbContent - O objeto JavaScript do novo JSON.
 * @param {string} commitMessage - Mensagem do commit.
 */
async function commitUpdateToGithub(newDbContent, commitMessage, branch = 'main') {
    const newContentString = JSON.stringify(newDbContent, null, 2) + '\n';
    
    const contentBase64 = Buffer.from(newContentString).toString('base64');

    let currentSha;
    try {
        const responseGet = await fetch(CONTENT_API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!responseGet.ok) {
            const errorText = await responseGet.text();
            console.error('Erro ao obter SHA do arquivo:', responseGet.status, errorText);
            throw new Error(`Falha ao obter SHA: ${responseGet.status}`);
        }

        const data = await responseGet.json();
        currentSha = data.sha;
        
    } catch (error) {
        console.error('Erro na etapa de GET do SHA:', error);
        throw new Error('Falha na obtenção do SHA para o commit.');
    }

    const payload = {
        message: commitMessage,
        content: contentBase64,
        sha: currentSha,
        branch
    };

    try {
        const responsePut = await fetch(CONTENT_API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify(payload),
        });

        if (!responsePut.ok) {
            const errorText = await responsePut.text();
            console.error('Erro ao fazer o commit:', responsePut.status, errorText);
            throw new Error(`Falha ao fazer commit: ${responsePut.status}`);
        }

        const commitData = await responsePut.json();
        console.log(`Commit bem-sucedido! SHA: ${commitData.commit.sha}`);
        return commitData;

    } catch (error) {
        console.error('Erro na etapa de PUT/Commit:', error);
        throw new Error('Falha ao enviar commit para o GitHub.');
    }
}