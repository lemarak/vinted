const express = require("express");
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");

const Offer = require("../models/Offer");

const router = express.Router();

const LIMIT = 5;

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // isAuthenticated is ok
    console.log("Je passe dans ma route /offer/publish");
    // get post values
    const {
      title,
      description,
      price,
      brand,
      size,
      condition,
      color,
      city,
    } = req.fields;

    const product_details = [
      { MARQUE: brand },
      { TAILLE: size },
      { ETAT: condition },
      { COULEUR: color },
      { EMPLACEMENT: city },
    ];

    // save offer without picture
    const offer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details,
      //   product_image: product_image,
      owner: req.user,
    });

    await offer.save();

    // upload picture
    let product_image = {};
    if (req.files.picture) {
      const resultUpload = await cloudinary.uploader.upload(
        req.files.picture.path,
        {
          folder: `/vinted/offer/${offer.id}`,
        }
      );
      product_image = { secure_url: resultUpload.secure_url };
    }

    // update offer with product_image
    offer.product_image = product_image;
    await offer.save();

    // for display
    const result = {
      _id: offer.id,
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: product_details,
      owner: {
        account: {
          username: req.user.account.username,
          phone: req.user.account.phone,
          avatar: req.user.account.avatar,
        },
        _id: req.user.id,
      },
      product_image: product_image,
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    // isAuthenticated is ok
    console.log("Je passe dans ma route /offer/update");

    const offer = await Offer.findById(req.fields.id_offer);
    if (!offer) {
      return res.status(400).json("Pas d'offre correspondante...");
    }

    // get post values
    const {
      id_offer,
      title,
      description,
      price,
      brand,
      size,
      condition,
      color,
      city,
    } = req.fields;

    const product_details = [
      { MARQUE: brand },
      { TAILLE: size },
      { ETAT: condition },
      { COULEUR: color },
      { EMPLACEMENT: city },
    ];

    console.log(req.fields);

    // upload picture
    const resultUpload = await cloudinary.uploader.upload(
      req.files.picture.path,
      {
        folder: `/vinted/offer/${offer.id}`,
      }
    );
    const product_image = { secure_url: resultUpload.secure_url };

    // update offer
    offer.product_name = title;
    offer.product_description = description;
    offer.product_price = price;
    offer.product_details = product_details;
    offer.product_image = product_image;
    offer.owner = req.user;

    await offer.save();

    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    console.log("Je passe dans ma route /offers");

    let { page, title, priceMin, priceMax, sort } = req.query;

    // pagination
    let skip = 0;
    if (!isNaN(page)) {
      if ((!page || page <= 0) && !isNaN(page)) {
        page = 1;
      }
      skip = (page - 1) * LIMIT;
    }

    // filter
    const filter = {};
    if (title) {
      filter.product_name = new RegExp(title, "i");
    }

    if ((priceMin && !isNaN(priceMin)) || (priceMax && !isNaN(priceMax))) {
      filter.product_price = {};
      if (priceMin) {
        filter.product_price.$gte = Number(priceMin);
      }
      if (priceMax) {
        filter.product_price.$lte = Number(priceMax);
      }
    }
    console.log(filter);

    // sort
    let querySort = {};
    if (sort === "price-desc") {
      querySort.product_price = -1;
    } else if (sort === "price-asc") {
      querySort.product_price = 1;
    }

    const offers = await Offer.find(filter)
      .skip(skip)
      .limit(LIMIT)
      .sort(querySort)
      .populate("owner", "account -_id");

    const result = { count: offers.length, offers: offers };
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    console.log(`Je passe dans ma route /offer/${req.params.id}`);
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    if (offer) {
      res.status(200).json(offer);
    } else {
      res.status(404).json({
        message: `L'id ${req.params.id} ne correspond à aucun produit.`,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// {
//   "error": "Cannot read property 'path' of undefined"
// }
