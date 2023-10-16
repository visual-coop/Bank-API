
export class InitializeController {

    indexPage (req,res) {
        res.status(403).end()
    }

    getMode (req,res) {
        res.send(process.env.NODE_ENV === 'dev' ? 'Deverlopment' : 'Production')
    }

}