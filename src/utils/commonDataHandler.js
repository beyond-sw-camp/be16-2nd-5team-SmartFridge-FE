export function getErrorMessage(error){
  // Check if error.response exists and has data property
  if (error?.response?.data?.status_message) {
    return error.response.data.status_message;
  }
  
  // Fallback to error message if response structure is different
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Fallback to error message property
  if (error?.message) {
    return error.message;
  }
  
  // Final fallback
  return '알 수 없는 오류가 발생했습니다.';
}
export function getResultData(response){
  // Check if response and data exist
  if (response?.data?.result) {
    return response.data.result;
  }
  
  // Fallback to data if result doesn't exist
  if (response?.data) {
    return response.data;
  }
  
  // Return the response itself if data doesn't exist
  return response;
}
export function getFridgeId(store) {
  return store.getters.getCurrentFridgeId;
}
