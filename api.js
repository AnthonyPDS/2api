import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const pllAlgorithms = [
    { name: 'Aa', algorithm: "x L2 D2 L' U' L D2 L' U L'", aliases: ['a perm'] },
    { name: 'Ab', algorithm: "x' L2 D2 L' U L D2 L' U' L'", aliases: ['b perm'] },
    { name: 'E', algorithm: "x' R U' R' D R U R' D' R U R' D R U' R' D'", aliases: ['e perm'] },
    { name: 'F', algorithm: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R", aliases: ['f perm'] },
    { name: 'Ga', algorithm: "R2 U R' U R' U' R U' R2 D U' R' U R D'", aliases: ['ga perm'] },
    { name: 'Gb', algorithm: "R' U' R U D' R2 U R' U R U' R U' R2 D", aliases: ['gb perm'] },
    { name: 'Gc', algorithm: "R2 U' R U' R U R' U R2 D' U R U' R' D", aliases: ['gc perm'] },
    { name: 'Gd', algorithm: "R U R' U' D R2 U' R U' R' U R' U R2 D'", aliases: ['gd perm'] },
    { name: 'H', algorithm: "M2 U M2 U2 M2 U M2", aliases: ['h perm'] },
    { name: 'Ja', algorithm: "R' U L' U2 R U' R' U2 R L", aliases: ['ja perm', 'j a'] },
    { name: 'Jb', algorithm: "R U R' F' R U R' U' R' F R2 U' R' U'", aliases: ['jb perm', 'j b'] },
    { name: 'Na', algorithm: "R U R' U R U R' F' R U R' U' R' F R2 U' R'", aliases: ['na perm'] },
    { name: 'Nb', algorithm: "R' U R U' R' F' U' F R U' R' F R' F' R U R", aliases: ['nb perm'] },
    { name: 'Ra', algorithm: "R U' R' U' R U R D R' U' R D' R' U2 R'", aliases: ['ra perm'] },
    { name: 'Rb', algorithm: "R' U2 R U2 R' F R U R' U' R' F' R2", aliases: ['rb perm'] },
    { name: 'T', algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'", aliases: ['t perm'] },
    { name: 'Ua', algorithm: "M2 U M U2 M' U M2", aliases: ['ua perm', 'u a'] },
    { name: 'Ub', algorithm: "M2 U' M U2 M' U' M2", aliases: ['ub perm', 'u b'] },
    { name: 'V', algorithm: "R' U R' U' y R' F' R2 U' R' U R' F R F", aliases: ['v perm'] },
    { name: 'Y', algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F'", aliases: ['y perm'] },
    { name: 'Z', algorithm: "M2 U M2 U M' U2 M2 U2 M' U2", aliases: ['z perm'] }
];

const normalizeName = (value = '') => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

const findPll = (value) => pllAlgorithms.find((pll) => {
    const names = [pll.name, ...pll.aliases];
    return names.some((name) => normalizeName(name) === normalizeName(value));
});

app.get('/',(req, res) => {
    res.json({
        date: new Date().toLocaleString('pt-BR'),
        status: 'API no Render funcionando!'
    });
});

app.get('/pll', (req, res) => {
    const requestedName = req.query.nome || req.query.name;

    if (!requestedName) {
        return res.json({
            total: pllAlgorithms.length,
            plls: pllAlgorithms.map(({ name, algorithm }) => ({ name, algorithm }))
        });
    }

    const pll = findPll(requestedName);
    if (!pll) {
        return res.status(404).json({
            error: 'PLL não encontrado',
            available: pllAlgorithms.map(({ name }) => name)
        });
    }

    return res.json({
        name: pll.name,
        algorithm: pll.algorithm
    });
});

app.get('/pll/:nome', (req, res) => {
    const pll = findPll(req.params.nome);
    if (!pll) {
        return res.status(404).json({
            error: 'PLL não encontrado',
            available: pllAlgorithms.map(({ name }) => name)
        });
    }

    return res.json({
        name: pll.name,
        algorithm: pll.algorithm
    });
});

// Porta dinâmica para o Render
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Servidor rodando na porta ${PORT}`);
});