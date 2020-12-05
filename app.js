const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const admin = require('./routes/admin');
const path = require('path'); // serve para manipular pastas
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
require('./models/Postagem');
const Postagem = mongoose.model('postagens');
require('./models/Categoria');
const Categoria = mongoose.model('categorias');
const usuarios = require('./routes/usuario');
const passport = require('passport');
require('./config/auth')(passport);
const db = require('./config/db');

    // Configurações
// Sessão
app.use(session({
    secret: 'blogNode',
    resave:true,
    saveUninitialized: true
}));

app.use(passport.initialize())
app.use(passport.session())

app.use(flash());
// Middleware
app.use((req,res,next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
})
// Body parser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
// Handlebars
app.engine('handlebars',handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
// Mongoose
mongoose.Promise = global.Promise;
mongoose.connect(db.mongoURI).then(()=>{
    console.log('MongoDB Conectado!')
}).catch((erro)=>{
    console.log('Mongo não conectado: '+erro)
})
// Public
app.use(express.static(path.join(__dirname, 'public'))) // pasta q guarda os arquivos estáticos


    // Rotas
app.get('/',(req,res)=>{
    Postagem.find().lean().populate('categorias').sort({data:'desc'}).then((postagens)=>{
        res.render('index', {postagens:postagens})
    }).catch(()=>{
        req.flash('error_msg', 'Erro interno')
        res.redirect('/404')
    })
    
})

app.get('/postagem/:slug',(req,res)=>{
    Postagem.findOne({slug: req.params.slug}).lean().then((postagem)=>{
        if(postagem){
            res.render('postagem/index', {postagem:postagem})
        }else{
            req.flash('error_msg', 'Esta postagem não existe')
            res.redirect('/')
        }
    }).catch(()=>{
        req.flash('error_msg','Erro interno')
        res.redirect('/')
    })
})

app.get('/404',(req,res)=>{
    res.send('<h1>Erro 404</h1>')
})

app.get('/categorias', (req,res)=>{
    Categoria.find().lean().then((categorias)=>{
        res.render('categorias/index', {categorias:categorias})

    }).catch(()=>{
        req.flash('error_msg','Erro ao listar as categorias')
        res.redirect('/')
    })
})

app.get('/categorias/:slug', (req,res)=>{
    Categoria.findOne({slug: req.params.slug}).then((categoria)=>{
        if(categoria){
            Postagem.find({categoria: categoria._id}).lean().then((postagens)=>{
                res.render('categorias/postagens',{postagens:postagens, categoriaNome:categoria.nome})
                console.log(categoria)
            }).catch(()=>{
                req.flash('error_msg','Erro ao listar os posts')
                res.redirect('/')
            })

        }else {
            req.flash('error_msg','Esta categoria não existe')
            res.redirect('/')
        }

    }).catch(()=>{
        req.flash('error_msg','Erro ao carregar a pagina desta categoria')
        res.redirect('/')
    })
})


// Grupo de rotas
app.use('/admin', admin)
app.use('/usuarios',usuarios)


// ativando o servidor
const PORT = process.env.PORT || 8081
app.listen(PORT, ()=>{
    console.log('Servidor rodando')
})