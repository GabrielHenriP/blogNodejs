const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Categoria');
const Categoria = mongoose.model('categorias');require('../models/Postagem');
const Postagem = mongoose.model('postagens');
const { eAdmin } = require('../helpers/eAdmin');

router.get('/', eAdmin , (req,res)=>{
    res.render("admin/index")
})

router.get('/posts',eAdmin ,(req,res)=>{
    res.send('pagina de posts')
})

router.get('/categorias',eAdmin, (req,res)=>{
    Categoria.find().sort({date: 'desc'}).then((categorias)=>{
        res.render('admin/categorias', {categorias: categorias.map(categorias => categorias.toJSON())})
    }).catch((error)=>{
        req.flash('error.msg', 'Erro ao listar categorias')
        res.redirect('/admin')
    })
    
})

router.get('/categorias/add',eAdmin, (req,res)=>{
    res.render('admin/addcategorias')
})

router.post('/categorias/nova',eAdmin ,(req,res)=>{
    let nome = req.body.nome;
    let slug = req.body.slug
    let erros = []

    if(!nome || typeof nome == undefined || nome == null){
        erros.push({text: 'Nome inválido'});

    }
    if(nome.length < 3){
        erros.push({text: 'Nome da categoria muito pequeno'})

    }
    if(!slug || typeof slug == undefined || slug == null){
        erros.push({text: 'Slug inválido'})
    }

    if(erros.length > 0){
        res.render('admin/addCategorias',{erros: erros})
    }else {
        const novaCategoria = {
            nome: nome,
            slug: slug
        }
    
        new Categoria(novaCategoria).save().then(()=>{
            req.flash('success_msg',' Categoria criada co sucesso!')
            res.redirect('/admin/categorias')
        }).catch((erro)=>{
            req.flash('error_msg',' Erro na criação da categoria')
            res.redirect('/admin')
        })
    }

    
})

router.get('/categorias/edit/:id',eAdmin, (req,res)=>{
    Categoria.findOne({_id:req.params.id}).lean().then((categoria)=>{
        res.render('admin/editCategorias', {categoria: categoria})
    }).catch(()=>{
        req.flash('error_msg','Esta categoria não existe')
        res.redirect('/admin/categorias')
    })
    
})

router.post('/categorias/edit',eAdmin,(req,res)=>{
    Categoria.findOne({_id: req.body.id}).then((categoria)=>{
        categoria.nome = req.body.nome;
        categoria.slug = req.body.nome;

        categoria.save().then(()=>{
            req.flash('success_msg', 'categoria editada com sucesso')
            res.redirect('/admin/categorias')
        }).catch(()=>{
            req.flash('error_msg','Erro ao editar categoria')
            res.redirect('/admin/categorias')
        })

    }).catch(()=>{
        req.flash('error_msg', 'Erro ao editar a categoria')
        res.redirect('/admin/categorias')
    })
})

router.get('/categorias/deletar/:id',eAdmin, (req, res) => {
    Categoria.findOneAndDelete({ _id: req.params.id }).then(() => {
        req.flash('success_msg', 'Categorias deletada com sucesso');
        res.redirect('/admin/categorias');
    }).catch((err) => {
        req.flash('error_msg', 'Erro ao deletar categoria');
       res.redirect('/admin/categorias');
    });
});

router.get('/postagens',eAdmin, (req,res)=>{
    Postagem.find().populate('categoria').sort({data:'desc'}).then((postagens)=>{
        res.render('admin/postagens',{ postagens:postagens.map( postagens => postagens.toJSON() ) })
    }).catch(()=>{
        req.flash('error_msg','Erro ao listar postagens')
        res.redirect('/admin')
    })

    
})

router.get('/postagens/add',eAdmin, (req,res)=>{
    Categoria.find().lean().then((categoria)=>{
        res.render('admin/addPostagens', {categorias: categoria})
    }).catch(()=>{
        req.flash('error_msg','Erro ao carregar o formulario')
        res.redirect('/admin')
    })
    
})

router.post('/postagens/nova',eAdmin, (req,res)=>{
    let erros = []

    if(req.body.categoria == '0'){
        erros.push({text: 'Categoria inválida, registre uma categoria'})
    }

    if(erros.length > 0){
        res.render('admin/addPostagem', {erros:erros})
    }else {
        const novaPostagem = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        }

        new Postagem(novaPostagem).save().then(()=>{
            req.flash('success_msg', 'Postagem criaca com sucesso')
            res.redirect('/admin/postagens')
        }).catch(()=>{
            req.flash('error_msg',' Erro ao criar uma Postagem')
            res.redirect('/admin/postagens')
        })
    }
})

router.get('/postagens/edit/:id',eAdmin, (req,res)=>{
    Postagem.findOne({_id: req.params.id}).lean().then((postagens)=>{

        Categoria.find().lean().then((categorias)=>{
            res.render('admin/editPostagens', {categorias: categorias, postagens:postagens})

        }).catch(()=>{
            req.flash('error_msg', 'Erro ao listar as categorias');
            res.redirect('/admin/postagens')
        })

    }).catch(()=>{
        req.flash('error_msg','Erro ao carrega formulario de edição de postagens');
        res.redirect('/admin/postagens')
    })

   
})

router.post('/postagens/edit',eAdmin, (req,res)=>{
    Postagem.findOne({_id: req.body.id}).then((postagens)=>{

        postagens.titulo = req.body.titulo
        postagens.slug = req.body.slug
        postagens.descricao = req.body.descricao
        postagens.conteudo = req.body.conteudo
        postagens.categoria = req.body.categoria

        postagens.save().then(()=>{
            req.flash('success_msg',' Postagem editada com sucesso')
            res.redirect('/admin/postagens')
        }).catch(()=>{
            req.flash('error_msg','Erro interno');
            res.redirect('/admin/postagens')
        })

    }).catch((erro)=>{
        console.log(erro)
        req.flash('error_msg','Erro ao salvar edição da postagem');
        res.redirect('/admin/postagens')
    })
})

router.get('/postagens/deletar/:id',eAdmin, (req,res)=>{
    Postagem.remove({_id: req.params.id}).then(()=>{
        req.flash('success_msg','Postagem deletada com sucesso')
        res.redirect('/admin/postagens')
    }).catch(()=>{
        req.flash('error_msg','Erro interno')
        res.redirect('/admin/postagens')
    })
})

module.exports = router