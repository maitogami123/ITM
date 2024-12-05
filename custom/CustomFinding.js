/**
 * Finds documents in the specified model with optional population of related documents.
 *
 * @param {Object} options - An object containing function parameters.
 * @param {Object} options.model - The Mongoose model to query.
 * @param {String|null} [options.id=null] - Optional ID of a specific document to find.
 *                                          If provided, finds a single document by ID.
 *                                          If omitted, finds all documents in the model.
 * @param {Object|Array} options.populateOptions - Population options for the query.
 *                                                 This specifies which related documents
 *                                                 should be included in the result.
 *
 **/
const findCustomWithPopulate = async ({
  model,
  id = null,
  populateOptions,
}) => {
  try {
    let query = id ? model.findById(id) : model.find();
    const documents = await query.populate(populateOptions);
    return documents;
  } catch (error) {
    throw error;
  }
};

/**
 * Generates populate options for a Mongoose query, with support for nested population if provided.
 * @param {string} path - The primary path to populate in the document. Populates this field if it exists in the schema.
 * @param {string} [populatePath] - The nested path to populate within the main path.
 * @param {string} [populateModel] - The model associated with the nested path.
 * @returns {Object|String|undefined} An object containing the populate configuration for Mongoose,
 *                                    or String of Undefined if no path is provided.
 */
const populateOptions = (path, populatePath = null, populateModel = null) => {
  const result = {};
  if (path == null) {
    return undefined;
  } else if (path && populatePath && populateModel) {
    result.path = path;
    result.populate = {
      path: populatePath,
      model: populateModel,
    };
  } else {
    result.path = path;
  }
  return result;
};

module.exports = { findCustomWithPopulate, populateOptions };
