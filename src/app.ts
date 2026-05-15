import { readFile, writeFile } from 'fs/promises';
import express, { type Request, type Response, type NextFunction} from 'express';
import cors from "cors"
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Bloco 3 - Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(process.cwd(), "public")))
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
    categoria: "Eletrônico" | "Roupa" | "Alimento" | "Outro",
    estoque?: number,
    disponivel?: boolean
}

// Bloco 2 - Persistência em JSON
const caminho: string = path.join(__dirname, "../dados/produtos.json")
// carregarDados()
async function carregarDados(): Promise<Produto[]> {
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
    const produtoString = JSON.stringify(produtos, null, 2)
    await writeFile(caminho, produtoString)
}
// Bloco 4 - Rotas API/ JSON
// Criar Produto - POST
app.post("/produtos", async (req, res) => {
    try{
        const {nome, preco, categoria, estoque} = req.body
        const arrProdutos = await carregarDados() || []
        let proximoID = arrProdutos.length > 0 ? Math.max(...arrProdutos.map(x => x.id)) : 0
        const produto: Produto = {
            id: proximoID + 1,
            nome,
            preco: Number(preco),
            categoria,
            estoque,
            disponivel: estoque > 0
        }
        arrProdutos.push(produto)

        await salvarProdutos(arrProdutos)
        console.log("Produto adicionado com sucesso")
        res.status(201).json(produto)
    } catch {
        res.status(500).json({erro: "Não foi possível criar produto"})
    }
})
// Atualizar Produto - PUT
app.put("/produtos/:id", async (req, res) => {
    try { 
        const arrProdutos = await carregarDados() || []
        const index = arrProdutos.findIndex(x => x.id === Number(req.params.id))

        if(index === -1) return res.status(404).json({erro: "ID inexistente"})
        const euNaoGostodeTS = {...arrProdutos[index], ...req.body, id: Number(req.params.id)}
        if (req.body.preco) euNaoGostodeTS.preco = Number(req.body.preco)
        arrProdutos[index] = euNaoGostodeTS

        await salvarProdutos(arrProdutos)
        console.log("Produto atualizado com sucesso")
        res.status(200).json(arrProdutos[index])
    } catch {
        res.status(500).json({erro: "Erro ao atualizar"})
    }
})
// Ver todos os produtos - GET
app.get("/produtos", async (req, res) => {
    try {
        console.log("Foi possível mostrar todos os Produtos")
        const arrProdutos = await carregarDados()
        res.status(200).json({arrProdutos})
    } catch {
        res.status(500).json({erro: "Erro ao ver os Produtos"})
    }
})
// Ver um produto pelo id - GET
app.get("/produtos/:id", async (req, res) => {
    try {
        const arrProdutos = await carregarDados()
        const index = arrProdutos.findIndex(x => x.id === Number(req.params.id))
        if(index === -1) return res.status(404).json({erro: "ID inesxistente"})

        console.log("Foi possível acessar Produto", index)
        res.status(200).json(arrProdutos[index])
    } catch {
        res.status(500).json({erro: "Erro ao ver um Produto"})
    }
})
// Deletar um produto - Delete
app.delete("/produtos/:id", async (req, res) => {
    try {
        const arrProdutos = await carregarDados()
        const index = arrProdutos.findIndex(x => x.id === Number(req.params.id))
        if(index === -1) return res.status(404).json({erro: "ID inesxistente"})
        
        const produtoRemove = arrProdutos[index]
        arrProdutos.splice(index, 1)
        
        console.log("Produto removido com sucesso")
        await salvarProdutos(arrProdutos)
        res.status(200).json(produtoRemove)
    } catch {
        res.status(500).json({erro: "Não foi possível excluir o produto"})
    }
})
// Cadastrar um item, ou seja, um segundo post
app.get("/loja/cadastrar", (req, res) => {
    res.render("cadastrar");
});
app.post("/loja/cadastrar", async (req, res) => {
    try {
        const arrProdutos = await carregarDados()
        const proximoID: number = arrProdutos.length > 0? Math.max(...arrProdutos.map(x => x.id)) : 0
        const produto: Produto = {
            id: proximoID + 1,
            nome: req.body.nome,
            preco: Number(req.body.preco),
            categoria: req.body.categoria,
            estoque: req.body.estoque,
            disponivel: Number(req.body.estoque) > 0
        }
        arrProdutos.push(produto)

        console.log("Produto cadastrado com sucesso")
        await salvarProdutos(arrProdutos)
        res.status(200).redirect("/loja/produtos/" + produto.id)
    } catch {
        res.status(500)
    }
})

// Bloco 5 - Páginas HTML com EJS
// Ver a lista de produtos
app.get("/loja/produtos", async (req, res) => {
    try {
        console.log("Foi possível acessar todos os produtos")
        const arrProdutos = await carregarDados()
        res.status(200).render("produtos", {arrProdutos})
    } catch {
        res.status(500)
    }
})
// Ver detalher de um produto
app.get("/loja/produtos/:id", async (req, res) => {
    try {
        const arrProdutos = await carregarDados()
        const index = arrProdutos.findIndex(x => x.id === Number(req.params.id))
        if(index === -1) return res.status(404).json({erro: "ID inesxistente"})

        console.log("Foi possível acessar Produto", index)
        res.status(200).render("detalhe", {arrProdutos: arrProdutos[index]})
    } catch {
        res.status(500).json({erro: "Erro ao ver um Produto"})
    }
})
// Função para mostrar o erro + Rota para testar o Erro
app.get("/teste-erro", (req, res, next) => {
    next(new Error("Erro proposital"));
    res.status(500)
});
app.use((erro: any, req: Request, res: Response, next: NextFunction) => {
    const err = erro as Error || new Error("Erro desconhecido")

    res.render("erro", {
        nome: err.name || "Error",
        mensagem: err.message || "Algo deu Errado",
        causa: err.cause,
        detalhe: process.env.NODE_ENV === "development"? err.stack: null
    })
})

app.listen(PORT, () => console.log("Rodando o server"))