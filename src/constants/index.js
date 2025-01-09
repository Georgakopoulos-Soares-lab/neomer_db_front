export const API_URL = 'http://localhost:8080';


export function capitalizeFirstLetterOfEachWord(str) {
    return str
      .split('_')
      .join(' ')
      .split(' ') // Split the string into an array of words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(' '); // Join the words back into a string
};