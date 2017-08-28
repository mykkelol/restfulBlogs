var bodyParser      = require("body-parser"),
express             = require("express"),
mongoose            = require("mongoose"),
passport            = require("passport"),
LocalStrategy       = require("passport-local"),
User                = require("./models/user"),
expressSanitizer    = require("express-sanitizer"),
methodOverride      = require("method-override"),
app                 = express();

// APP CONFIG
// mongoose.connect("mongodb://localhost/personal_blog", {useMongoClient:true});
mongoose.connect("mongodb://mykke:change-world@ds161713.mlab.com:61713/mykke-blog", {useMongoClient:true});
mongoose.Promise = global.Promise;
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public")); // midware for CSS/JS
app.use(methodOverride("_method"));
app.use(expressSanitizer()); // midware against XSS risks
app.set("view engine", "ejs");

// PASSPORT CONFIG
    app.use(require("express-session")({
        secret: "change-world",
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
    
    // middleware for passing values of logged in users
    app.use(function(req, res, next){
        res.locals.currentUser = req.user;
        next();
    });

// MODEL CONFIG
    var blogSchema = new mongoose.Schema({
        title: String,
        image: String,
        body: String,
        created: {type: Date, default: Date.now}
    })

    var Blog = mongoose.model('Blog', blogSchema);


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
               res.render('index', {blogs:blogs, currentUser: req.user});
           }
        });
    });
    
    // NEW ROUTE - show create form
    app.get('/blogs/new', isLoggedIn, function(req, res){
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
    
    // EDIT ROUTE - show edit form
    app.get('/blogs/:id/edit', isLoggedIn, function(req, res){
        Blog.findById(req.params.id, function(err, foundBlog){
            if (err){
                console.log(err);
            } else {
                res.render('edit', {blog:foundBlog});   
            }
        });
    });
    
    // UPDATE ROUTE
        // could use post instead of put, but put has semantics
    app.put('/blogs/:id', function(req, res){
        req.body.blog.body = req.sanitize(req.body.blog.body);
        Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, foundBlog){
            // (id of blog to update, data to update, callback)
            if (err){
                console.log(err);
            } else {
                res.redirect("/blogs/" + req.params.id);
            }
        });
    });
    
    // DELETE ROUTE
    app.delete('/blogs/:id', isLoggedIn, function(req, res){
        Blog.findByIdAndRemove(req.params.id, function(err, foundblog){
            if (err){
                console.log(err);
            } else {
                res.redirect("/blogs");
            }
        });
    });


// AUTH ROUTING
    // REGISTER FORM
    app.get("/register", function(req, res){
        res.render("register"); 
    });
    
    // HANDLING REGISTER
    app.post("/register", function(req, res){
        var newUser = new User({username: req.body.username});
        User.register(newUser, req.body.password, function(err, user){
            if (err){
                console.log(err);
            }
            passport.authenticate("local")(req, res, function(){
                res.redirect("/blogs"); 
            });
        });
    });


    // LOGIN FORM
    app.get("/admin-login", function(req,res){
        res.render("login");
    });
    // HANDLING LOGIN
    app.post("/admin-login", passport.authenticate("local", 
        {
            successRedirect: "/blogs",
            failureRedirect: "/admin-login"
        }), function(req, res){
            // app.post(post page, middleware, callback)
            
    });
    // LOGOUT ROUTE
    app.get("/logout", function(req, res){
        req.logout();
        res.redirect("/blogs");
    })
    
function isLoggedIn(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    res.send("You must be an admin");
}

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server is running!");
})