const roleAdmin = require("./roleAdminModel")()
const rolePermission = require("./rolePermissionRelationModel")()
const roleResource = require("./roleResourceRelationModel")()

const createRoleAdmin = async (req, res) => {
    try {
        await roleAdmin.createRelation(req.body)
        res.status(200).json(
            {
                code: 200,
                data: "Successful"
            }
        )
    } catch (error) {
        res.status(500).json(
            {
                code: 500,
                data: "something wrong"
            }
        )
    }
}
const createRolePermission = async (req, res) => {
    try {
        await rolePermission.createRelation(req.body)
        res.status(200).json(
            {
                code: 200,
                data: "Successful"
            }
        )
    } catch (error) {
        res.status(500).json(
            {
                code: 500,
                data: "something wrong"
            }
        )
    }
}
const createRoleResource = async (req, res) => {
    try {
        await roleResource.createRelation(req.body)
        res.status(200).json(
            {
                code: 200,
                data: "Successful"
            }
        )
    } catch (error) {
        console.log(error)
        res.status(500).json(
            {
                code: 500,
                data: "something wrong"
            }
        )
    }
}


const deleteRoleResource = async (req, res) => {
    try {
        await roleResource.deleteRelation(req.query)
        res.status(200).json(
            {
                code: 200,
                data: "Successful"
            }
        )
    } catch (error) {
        res.status(500).json(
            {
                code: 500,
                data: "something wrong"
            }
        )
    }
}


const deleteRoleAdmin = async (req, res) => {
    try {
        await roleAdmin.deleteRelation(req.query)
        res.status(200).json(
            {
                code: 200,
                data: "Successful"
            }
        )
    } catch (error) {
        res.status(500).json(
            {
                code: 500,
                data: "something wrong"
            }
        )
    }
}

const deleteRolePermission = async (req, res) => {
    try {
        await rolePermission.deleteRelation(req.query)
        res.status(200).json(
            {
                code: 200,
                data: "Successful"
            }
        )
    } catch (error) {
        res.status(500).json(
            {
                code: 500,
                data: "something wrong"
            }
        )
    }
}

const fetchRelation =async(req,res)=>{
    try {
        let {id}=req.params
        let result=await roleAdmin.fetchRelation(id)
        res.status(200).json(
            {
                code: 200,
                data: result
            }
        )
    } catch (error) {
        console.log(error)
        res.status(500).json(
            {
                code: 500,
                data: "something wrong"
            }
        )
    }
}

module.exports = {
    fetchRelation,
    deleteRolePermission, 
    deleteRoleAdmin, 
    deleteRoleResource, 
    createRoleResource, 
    createRolePermission, 
    createRoleAdmin
}