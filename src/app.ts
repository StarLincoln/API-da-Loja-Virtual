import { readFile, writeFile } from 'fs/promises';
import express from 'express'
const app = express();
const PORT = 3000;

// Bloco 3 - Middlewares
app.use(express.json())
express.urlencoded({extended: true})
express.static("public")
app.set("view engine", "ejs")
app.set("views", "/home/caio_lincoln/VS Code/api-loja/src/views")
// Logger customizado
app.use((req, res, next) => {
    const hora = new Date().toLocaleTimeString()
    console.log(hora, req.method, req.url)
    next()
})

// Bloco 1 - Interface
interface Produto {
    id: number,
    nome: string,
    preco: number,
    categoria?: "Eletrônico" | "Roupa" | "Alimento" | "Outro",
    estoque?: number,
    disponivel?: boolean
}

// Bloco 2 - Persistência em JSON
const caminho: string = "/home/caio_lincoln/VS Code/api-loja/dados/produtos.json"
// CarregarDados()
async function CarregarDados(): Promise<Produto[]> {
    try{
        const data = await readFile(caminho, 'utf-8')
        const arrProdutos: Produto[] = JSON.parse(data)
        return arrProdutos
    } catch (err) {
        writeFile(caminho, "[]")
        return []
    }
}
// salvarProdutos()
async function salvarProdutos(produtos: Produto[]): Promise<void> {
    const produtoString = JSON.stringify(produtos)
    await writeFile(caminho, JSON.stringify(produtoString, null, 2))
}

// Bloco 4 - Rotas API/ JSON
// Criar Produto
app.post("/produtos", async (req, res) => {
    try{
        const {nome, preco, categoria, estoque} = req.body
        const arrProdutos = await CarregarDados() || []
        const produto: Produto = {
            id: arrProdutos.length + 1,
            nome,
            preco: Number(preco),
            categoria,
            estoque,
            disponivel: Boolean(estoque)
        }
        arrProdutos.push(produto)

        await writeFile(caminho, JSON.stringify(arrProdutos))
        console.log("Produto adicionado com sucesso")
        res.status(201).json(produto)
    } catch {
        res.status(500).json({erro: "Não foi possível criar produto"})
    }
})
// Atualizar Produto
app.put("/produtos/:id", async (req, res) => {
    try { 
        const arrProdutos = await CarregarDados() || []
        const index = arrProdutos.findIndex(x => x.id === Number(req.params.id))

        if(index === -1) return res.status(404).json({erro: "ID inexistente"})

        const euNaoGostodeTS = {...arrProdutos[index], ...req.body, id: Number(req.params.id)}
        if (req.body.preco) euNaoGostodeTS.preco = Number(req.body.preco)
        arrProdutos[index] = euNaoGostodeTS

        await writeFile(caminho, JSON.stringify(arrProdutos, null, 2))
        console.log("Produto atualizado com sucesso")
        res.status(200).json(arrProdutos[index])
    } catch {
        res.status(500).json({erro: "Erro ao atualizar"})
    }
})
app.listen(PORT, () => console.log("Rodando o server"))