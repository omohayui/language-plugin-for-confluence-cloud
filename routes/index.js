export default function routes(app, addon) {
    // Redirect root path to /atlassian-connect.json,
    // which will be served by atlassian-connect-express.
    app.get('/', (req, res) => {
        res.redirect('/atlassian-connect.json');
    });

    // Verify that the incoming request is authenticated with Atlassian Connect.
    app.get('/v1/dispatchLanguage', addon.authenticate(), function(req, res){

        //  Grab all input parameters - sent through to us as query params.
        var language    = req.query['language'],
            pageTitle   = req.query['pageTitle'],
            pageId      = req.query['pageId'],
            pageVersion = req.query['pageVersion'],
            macroId     = req.query['macroId'];
        var clientKey = req.context.clientKey;

        // Default Language: ja
        var selected = 'ja';
        if (req.cookies && req.cookies.docslang) {
            selected = req.cookies.docslang;
        } else if (req.headers['accept-language']) {
//            selected = req.headers['accept-language']; // TODO convert en-US -> en
        }
        console.log('selected: ' + selected + ', language: ' + language);

        // Selected Language?
        if (language != selected) {
            res.render('language');
            return;
        }

        //  Execute API request to get the macro body.
        getHTTPClient(clientKey).get(
            '/rest/api/content/' + pageId +
            '/history/' + pageVersion +
            '/macro/id/' + macroId,
            function(err, response, contents){

                //  If we've encountered errors, render an error screen.
                if(err || (response.statusCode < 200 || response.statusCode > 299)) {
                    console.log(err);
                    res.render('language');
                }

                //  Parse the response, and send the body through.
                contents = JSON.parse(contents);

                //  Render with required body.
                res.render('language', {body : contents.body, pageTitle: pageTitle});
            }
        );
    });

    app.get('/setLanguage', addon.authenticate(), function(req, res){
        var lang = req.query['lang'];
        if (lang) {
            res.setHeader('Set-Cookie', ['docslang=' + lang]);
            res.render('set-language', {lang : lang});
            return;
        }
        res.render('set-language');
    });

    // Returns a HTTP client which can make calls to our host product.
    // @param clientKey formed when app created.
    // @param userKey formed when app created.
    // @returns {*} http client
    function getHTTPClient (clientKey, userKey){
        return addon.httpClient({
            clientKey : clientKey,
            userKey   : userKey,
            appKey    : addon.key
        });
    }
}
