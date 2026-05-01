import { readFile, writeFile } from 'fs/promises';
import express from 'express'
const app = express();
const PORT = 3000;

app.use(express.json())

const caminho: string = "/home/caio_lincoln/VS Code/api-loja/dados/produtos.json"
async function lerDados() {
    try{
        const data = await readFile(caminho, 'utf-8')
        const arrProdutos: Produto[] = JSON.parse(data)
        return arrProdutos
    } catch (err) {
        console.log("não foi possível ler o json.", err)
    }
}

// Bloco 1 - Interface
interface Produto {
    id: number,
    nome: string,
    preco: number,
    categoria?: "Eletrônico" | "Roupa" | "Alimento" | "Outro",
    estoque?: number,
    disponivel?: boolean
}

app.post("/produtos", async (req, res) => {
    try{
        const {nome, preco, categoria, estoque} = req.body
        const arrProdutos = await lerDados() || []
        const produto: Produto = {
            id: arrProdutos.length + 1,
            nome,
            preco: Number(preco),
            categoria,
            estoque,
            disponivel: Boolean(estoque)
        }
        
        await writeFile(caminho, JSON.stringify(arrProdutos))
        console.log("Produto adicionado com sucesso")
        res.status(201).json(produto)
    } catch (err) {
        res.status(500).json({erro: "Não foi possível criar produto"})
    }
})
app.listen(PORT, () => console.log("Rodando o server"))