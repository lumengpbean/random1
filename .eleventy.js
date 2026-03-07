module.exports = function(eleventyConfig) {
  // Tell Eleventy to copy this specific file
  eleventyConfig.addPassthroughCopy("style.css"); 
  eleventyConfig.addPassthroughCopy("admin"); 

  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site"
    }
  }
};