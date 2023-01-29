const resourceModule = require("./resouceModel")()
const getResources = async (req, res) => {
    try {
        let { limit, offset } = req.query;
        let current = limit && limit > 0 ? Math.floor(offset / limit) + 1 : 1;
        let { list, total } = await resourceModule.getResources(offset, limit);
        return res.status(200).json({
            status: 200,
            data: {
                list,
                current,
                pageSize: limit || 20,
                total
            }
        });
    } catch (error) {
        return res.status(500).json({ status: 500, errorMessage: error });
    }
}
const deleteResources = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res
                .status(500)
                .json({ status: 500, errorMessage: "missing argument" });
        await resourceModule.deleteResource(id);

    } catch (error) {
        return res.status(500).json({ status: 500, errorMessage: error });
    }
}

const addAndUpdateResources = async (req, res) => {
    try {
        await resourceModule.createOrUpdateResource(req.body);
        return res.status(200).json({
            code: 200,
            errorMessage: "successful update role admin relation"
        });
    } catch (error) {
        return res.status(500).json({ status: 500, errorMessage: error.errorMessage });
    }
}
module.exports = {
    getResources, deleteResources, addAndUpdateResources
}