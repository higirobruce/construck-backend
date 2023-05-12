const express = require('express');
const { Items } = require('../models/item');
const router = express.Router();

router.get('/items', async (req, res) => {
    const pageSize = 15;
    const currentPage = +req.query.page;

    const totalItems = await Items.find();
    const itemsQuery = Items.find();

    if (pageSize && currentPage)
        itemsQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);

    const items = await itemsQuery;
    if(!items) return res.status(404).json({message: "No Items Found"});

    res.status(200).send({items, totalItems})
})

router.post('/items', async (req, res) => {
    const { 
        itemPart,
        uom,
        itemCategory
    } = req.body.payload;

    let itemId = await Items.find();
    if(!itemId) return res.status(404).json({message: "No Items Found"});

    const items = new Items({
        '#': itemId.length + 1,
        'ITEM & PART': itemPart,
        'UOM': uom,
        'ITEM CATEGORY': itemCategory
    })
    
    await items.save();

    return res.status(200).send(items)
});

module.exports = router;