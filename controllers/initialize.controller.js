
export class InitializeController {

    indexPage (req,res) {
        res.status(403).end()
    }

    getMode () {
        res.send(process.env.NODE_ENV === 'dev' ? 'Deverlopment' : 'Production')
    }

}