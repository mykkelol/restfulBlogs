var bodyParser      = require("body-parser"),
express             = require("express"),
mongoose            = require("mongoose"),
expressSanitizer    = require("express-sanitizer"),
methodOverride      = require("method-override"),
app                 = express();

// APP CONFIG
mongoose.connect("mongodb://localhost/personal_blog", {useMongoClient:true});
mongoose.Promise = global.Promise;
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public")); // midware for CSS/JS
app.use(methodOverride("_method"));
app.use(expressSanitizer()); // midware against XSS risks
app.set("view engine", "ejs");

// MODEL CONFIG
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {type: Date, default: Date.now}
})

var Blog = mongoose.model('Blog', blogSchema);

// Blog.create({
//     title: "CHANGE WORLD",
//     image: "https://unsplash.com/?photo=_hpk_92Crhs",
//     body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
// })

// RESTful ROUTING
    // ROOT ROUTE
    app.get(['/', '/home'], function(req, res){
        res.redirect("/blogs");
    });
    
    // INDEX ROUTE
    app.get('/blogs', function(req, res){
        Blog.find().sort('-created').exec(function(err, blogs){
           if (err){
               console.log(err);
           } else {
               res.render('index', {blogs:blogs});
           }
        });
    });
    
    // NEW ROUTE - show create form
    app.get('/blogs/new', function(req, res){
        res.render('new');
    });
    
    // CREATE ROUTE
    app.post('/blogs', function(req, res){
        // sanitize body to wrap HTML with protection lol
        req.body.blog.body = req.sanitize(req.body.blog.body);
        Blog.create(req.body.blog, function(err, newBlog){
            if (err) {
                console.log(err);
            } else {
                res.redirect('/blogs');
            }
        });
    });
    
    // SHOW ROUTE
    app.get('/blogs/:id', function(req, res){
        Blog.findById(req.params.id, function(err, foundBlog){
            if (err){
                console.log(err);
            } else {
                res.render('show', {blog:foundBlog});
            }
        });
    });


app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server is running!");
})