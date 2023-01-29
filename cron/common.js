const decodeArray2Result = (input, result) => {
  if (!result) result = {};
  if (input) {
    if (Array.isArray(input)) {
      input.forEach(element => {
        result = decodeArray2Result(element, result);
      })
    } else {
      result = { ...result, ...input }
    }
  }
  return result;
}

module.exports = { decodeArray2Result };