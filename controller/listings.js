const Listing=require("../models/listing.js")

module.exports.index=async (req, res) => {
    const allListings = await Listing.find();
    res.render("listings/index.ejs", { allListings });
}

module.exports.renderNewForm= (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.createListing=async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner=req.user._id;
    newListing.image.url=req.file.path;
    newListing.image.filename=req.file.filename;
    await newListing.save();
    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
}

module.exports.showListing=async (req, res, next) => {
    let { id } = req.params;
    const list = await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    
    if (!list) {
        req.flash("error", "Listing not found or has been deleted!");
        return res.redirect("/listings");
    }
    
    res.render("./listings/show.ejs", { list });
}

module.exports.editListing=async (req, res) => {
    let { id } = req.params;
    let list = await Listing.findById(id);
    if(!list){
        req.flash("error","no listing present ");
        res.redirect("/listings");
    }
    let originalImageUrl=list.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("./listings/edit.ejs", { list,originalImageUrl });
}

module.exports.updateListing=async (req, res) => {
    let { id } = req.params;
    
  let listing=  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if(typeof req.file!=="undefined"){
    listing.image.url=req.file.path;
    listing.image.filename=req.file.filename;
    await listing.save();
  }
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing=async (req, res) => {
    let { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    
    if (!deletedListing) {
        req.flash("error", "Listing was already deleted");
    } else {
        req.flash("success", "Listing was successfully deleted!");
    }
    
    res.redirect("/listings");
}