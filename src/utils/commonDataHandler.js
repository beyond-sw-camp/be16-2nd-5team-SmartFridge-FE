export function getErrorMessage(error){
  return error.response.data.status_message;
}
export function getResultData(response){
  return response.data.result;
}
export function getFridgeId(store) {
  return store.getters.getCurrentFridgeId;
}

export function getFridgeId2() {
  return this.$store.getters.getCurrentFridgeId;
}
