import Web1337 from "../index.js"



/**
 * 
 * @param {Web1337} web1337  
 */
export let getContractMetadata=async(web1337,contractID)=>web1337.getRequestToNode(`/account/${contractID}`)


/**
 * 
 * @param {Web1337} web1337  
 */
export let getContractStorage=async(web1337,contractID,storageName)=>web1337.getRequestToNode(`/state/${contractID}_STORAGE_/${storageName}`)



/**
 * 
 * @param {Web1337} web1337
 * @param {*} contractID
 * @param {*} eventID
 */
export let subscribeForEventsByContract=async(web1337,contractID,eventID='ALL')=>{}