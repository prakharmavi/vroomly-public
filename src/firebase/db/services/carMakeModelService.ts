import { collection, doc, getDocs, query, setDoc, getDoc } from "firebase/firestore";
import db from "../firestore";
import { CAR_DATA } from "@/utils/carDataUtils";

/**
 * Fetch all car makes from Firestore
 * @returns Array of car makes
 */
export async function getCarMakesFromFirestore(): Promise<string[]> {
  try {
    const makesRef = collection(db, "carMakes");
    const querySnapshot = await getDocs(query(makesRef));
    
    const makes: string[] = [];
    querySnapshot.forEach(doc => {
      makes.push(doc.id);
    });
    
    return makes.sort();
  } catch (error) {
    console.error("Error fetching car makes:", error);
    return [];
  }
}

/**
 * Fetch models for a specific make from Firestore
 * @param make The car make to get models for
 * @returns Array of car models for the specified make
 */
export async function getCarModelsFromFirestore(make: string): Promise<string[]> {
  try {
    if (!make) return [];
    
    const makeDocRef = doc(db, "carMakes", make);
    const makeDoc = await getDoc(makeDocRef);
    
    if (makeDoc.exists()) {
      const data = makeDoc.data();
      return data.models || [];
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching models for make "${make}":`, error);
    return [];
  }
}

/**
 * Add a custom car make to Firestore
 * @param make The make to add
 * @returns Promise that resolves when the operation completes
 */
export async function addCustomMake(make: string): Promise<void> {
  try {
    if (!make) return;
    
    const makeDocRef = doc(db, "carMakes", make);
    await setDoc(makeDocRef, { models: [] });
  } catch (error) {
    console.error(`Error adding custom make "${make}":`, error);
    throw error;
  }
}

/**
 * Add a custom model to a make in Firestore
 * @param make The make to add the model to
 * @param model The model to add
 * @returns Promise that resolves when the operation completes
 */
export async function addCustomModel(make: string, model: string): Promise<void> {
  try {
    if (!make || !model) return;
    
    const makeDocRef = doc(db, "carMakes", make);
    const makeDoc = await getDoc(makeDocRef);
    
    if (makeDoc.exists()) {
      const data = makeDoc.data();
      const models = data.models || [];
      
      // Only add the model if it doesn't already exist
      if (!models.includes(model)) {
        models.push(model);
        await setDoc(makeDocRef, { models: models.sort() });
      }
    } else {
      // If the make doesn't exist, create it with the model
      await setDoc(makeDocRef, { models: [model] });
    }
  } catch (error) {
    console.error(`Error adding custom model "${model}" to make "${make}":`, error);
    throw error;
  }
}

/**
 * Populate Firestore with data from the CSV
 * This should be called once during app initialization or from an admin panel
 * @returns Promise that resolves when the operation completes
 */
export async function populateCarDataToFirestore(): Promise<void> {
  try {
    const lines = CAR_DATA.split('\n').filter(line => line.trim().length > 0);
    // Skip header
    const dataLines = lines.slice(1);
    
    const makeModelsMap: Record<string, string[]> = {};
    
    dataLines.forEach(line => {
      const [make, model] = line.split(',').map(s => s.trim());
      
      if (make && make.length > 0) {
        if (!makeModelsMap[make]) {
          makeModelsMap[make] = [];
        }
        
        if (model && model.length > 0 && !makeModelsMap[make].includes(model)) {
          makeModelsMap[make].push(model);
        }
      }
    });
    
    // Batch write all the makes and models to Firestore
    const batch = Object.entries(makeModelsMap);
    for (const [make, models] of batch) {
      const makeDocRef = doc(db, "carMakes", make);
      await setDoc(makeDocRef, { models: models.sort() });
    }
    
  } catch (error) {
    console.error("Error populating car data to Firestore:", error);
    throw error;
  }
}
