export const API_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
  ? 'http://localhost:8080'  // Dev
  : 'https://104.155.165.75';  // Prod temporary


export function capitalizeFirstLetterOfEachWord(str) {
    return str
      .split('_')
      .join(' ')
      .split(' ') // Split the string into an array of words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(' '); // Join the words back into a string
};

export const multi_doughnut_cached_data = {
  "11": [
      {
          "cancer_type": "Colon adenocarcinoma",
          "count": "30"
      },
      {
          "cancer_type": "Skin Cutaneous Melanoma",
          "count": "6"
      },
      {
          "cancer_type": "Lung adenocarcinoma",
          "count": "10"
      },
      {
          "cancer_type": "Glioblastoma multiforme",
          "count": "2"
      },
      {
          "cancer_type": "Lung squamous cell carcinoma",
          "count": "18"
      },
      {
          "cancer_type": "Bone Cancer",
          "count": "4"
      },
      {
          "cancer_type": "Breast invasive carcinoma",
          "count": "2"
      },
      {
          "cancer_type": "Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
          "count": "2"
      },
      {
          "cancer_type": "Stomach adenocarcinoma",
          "count": "12"
      },
      {
          "cancer_type": "Head and Neck squamous cell carcinoma",
          "count": "2"
      },
      {
          "cancer_type": "Uterine Corpus Endometrial Carcinoma",
          "count": "14"
      },
      {
          "cancer_type": "Liver hepatocellular carcinoma",
          "count": "4"
      }
  ],
  "12": [
      {
          "cancer_type": "Colon adenocarcinoma",
          "count": "6262"
      },
      {
          "cancer_type": "Breast invasive carcinoma",
          "count": "778"
      },
      {
          "cancer_type": "Lung adenocarcinoma",
          "count": "1286"
      },
      {
          "cancer_type": "Glioblastoma multiforme",
          "count": "394"
      },
      {
          "cancer_type": "Bone Cancer",
          "count": "198"
      },
      {
          "cancer_type": "Skin Cutaneous Melanoma",
          "count": "1658"
      },
      {
          "cancer_type": "Lung squamous cell carcinoma",
          "count": "2106"
      },
      {
          "cancer_type": "Bladder Urothelial Carcinoma",
          "count": "512"
      },
      {
          "cancer_type": "Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
          "count": "184"
      },
      {
          "cancer_type": "Brain Lower Grade Glioma",
          "count": "42"
      },
      {
          "cancer_type": "Thyroid carcinoma",
          "count": "76"
      },
      {
          "cancer_type": "Uterine Corpus Endometrial Carcinoma",
          "count": "2364"
      },
      {
          "cancer_type": "Prostate adenocarcinoma",
          "count": "34"
      },
      {
          "cancer_type": "Liver hepatocellular carcinoma",
          "count": "682"
      },
      {
          "cancer_type": "Cervical squamous cell carcinoma and endocervical adenocarcinoma",
          "count": "100"
      },
      {
          "cancer_type": "Ovarian serous cystadenocarcinoma",
          "count": "302"
      },
      {
          "cancer_type": "Kidney Chromophobe",
          "count": "114"
      },
      {
          "cancer_type": "Kidney renal clear cell carcinoma",
          "count": "500"
      },
      {
          "cancer_type": "Head and Neck squamous cell carcinoma",
          "count": "686"
      },
      {
          "cancer_type": "Stomach adenocarcinoma",
          "count": "1858"
      }
  ],
  "13": [
      {
          "cancer_type": "Thyroid carcinoma",
          "count": "1966"
      },
      {
          "cancer_type": "Brain Lower Grade Glioma",
          "count": "1270"
      },
      {
          "cancer_type": "Stomach adenocarcinoma",
          "count": "52064"
      },
      {
          "cancer_type": "Kidney renal clear cell carcinoma",
          "count": "12456"
      },
      {
          "cancer_type": "Head and Neck squamous cell carcinoma",
          "count": "18218"
      },
      {
          "cancer_type": "Colon adenocarcinoma",
          "count": "173164"
      },
      {
          "cancer_type": "Bone Cancer",
          "count": "4856"
      },
      {
          "cancer_type": "Glioblastoma multiforme",
          "count": "10730"
      },
      {
          "cancer_type": "Breast invasive carcinoma",
          "count": "20790"
      },
      {
          "cancer_type": "Lung adenocarcinoma",
          "count": "36070"
      },
      {
          "cancer_type": "Lung squamous cell carcinoma",
          "count": "56520"
      },
      {
          "cancer_type": "Skin Cutaneous Melanoma",
          "count": "51658"
      },
      {
          "cancer_type": "Bladder Urothelial Carcinoma",
          "count": "12430"
      },
      {
          "cancer_type": "Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
          "count": "4064"
      },
      {
          "cancer_type": "Uterine Corpus Endometrial Carcinoma",
          "count": "61954"
      },
      {
          "cancer_type": "Prostate adenocarcinoma",
          "count": "976"
      },
      {
          "cancer_type": "Kidney Chromophobe",
          "count": "3290"
      },
      {
          "cancer_type": "Ovarian serous cystadenocarcinoma",
          "count": "9878"
      },
      {
          "cancer_type": "Liver hepatocellular carcinoma",
          "count": "18904"
      },
      {
          "cancer_type": "Cervical squamous cell carcinoma and endocervical adenocarcinoma",
          "count": "2606"
      }
  ],
  "14": [
      {
          "cancer_type": "Thyroid carcinoma",
          "count": "19442"
      },
      {
          "cancer_type": "Brain Lower Grade Glioma",
          "count": "13766"
      },
      {
          "cancer_type": "Stomach adenocarcinoma",
          "count": "560750"
      },
      {
          "cancer_type": "Head and Neck squamous cell carcinoma",
          "count": "204892"
      },
      {
          "cancer_type": "Kidney renal clear cell carcinoma",
          "count": "131976"
      },
      {
          "cancer_type": "Colon adenocarcinoma",
          "count": "2085732"
      },
      {
          "cancer_type": "Lung adenocarcinoma",
          "count": "397058"
      },
      {
          "cancer_type": "Lung squamous cell carcinoma",
          "count": "628612"
      },
      {
          "cancer_type": "Bladder Urothelial Carcinoma",
          "count": "135322"
      },
      {
          "cancer_type": "Breast invasive carcinoma",
          "count": "223118"
      },
      {
          "cancer_type": "Skin Cutaneous Melanoma",
          "count": "622608"
      },
      {
          "cancer_type": "Glioblastoma multiforme",
          "count": "122776"
      },
      {
          "cancer_type": "Bone Cancer",
          "count": "53188"
      },
      {
          "cancer_type": "Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
          "count": "44464"
      },
      {
          "cancer_type": "Ovarian serous cystadenocarcinoma",
          "count": "105962"
      },
      {
          "cancer_type": "Kidney Chromophobe",
          "count": "36470"
      },
      {
          "cancer_type": "Uterine Corpus Endometrial Carcinoma",
          "count": "701146"
      },
      {
          "cancer_type": "Prostate adenocarcinoma",
          "count": "10802"
      },
      {
          "cancer_type": "Liver hepatocellular carcinoma",
          "count": "206596"
      },
      {
          "cancer_type": "Cervical squamous cell carcinoma and endocervical adenocarcinoma",
          "count": "28306"
      }
  ],
  "15": [
      {
          "cancer_type": "Thyroid carcinoma",
          "count": "101494"
      },
      {
          "cancer_type": "Brain Lower Grade Glioma",
          "count": "74876"
      },
      {
          "cancer_type": "Stomach adenocarcinoma",
          "count": "2957276"
      },
      {
          "cancer_type": "Kidney renal clear cell carcinoma",
          "count": "692142"
      },
      {
          "cancer_type": "Head and Neck squamous cell carcinoma",
          "count": "1110542"
      },
      {
          "cancer_type": "Colon adenocarcinoma",
          "count": "11948004"
      },
      {
          "cancer_type": "Glioblastoma multiforme",
          "count": "675118"
      },
      {
          "cancer_type": "Breast invasive carcinoma",
          "count": "1186326"
      },
      {
          "cancer_type": "Skin Cutaneous Melanoma",
          "count": "3746616"
      },
      {
          "cancer_type": "Lung adenocarcinoma",
          "count": "2133336"
      },
      {
          "cancer_type": "Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
          "count": "238822"
      },
      {
          "cancer_type": "Bone Cancer",
          "count": "284858"
      },
      {
          "cancer_type": "Lung squamous cell carcinoma",
          "count": "3367952"
      },
      {
          "cancer_type": "Bladder Urothelial Carcinoma",
          "count": "720532"
      },
      {
          "cancer_type": "Cervical squamous cell carcinoma and endocervical adenocarcinoma",
          "count": "153768"
      },
      {
          "cancer_type": "Ovarian serous cystadenocarcinoma",
          "count": "557664"
      },
      {
          "cancer_type": "Prostate adenocarcinoma",
          "count": "57668"
      },
      {
          "cancer_type": "Liver hepatocellular carcinoma",
          "count": "1090394"
      },
      {
          "cancer_type": "Uterine Corpus Endometrial Carcinoma",
          "count": "3795940"
      },
      {
          "cancer_type": "Kidney Chromophobe",
          "count": "194018"
      }
  ],
  "16": [
      {
          "cancer_type": "Thyroid carcinoma",
          "count": "357192"
      },
      {
          "cancer_type": "Brain Lower Grade Glioma",
          "count": "265288"
      },
      {
          "cancer_type": "Head and Neck squamous cell carcinoma",
          "count": "4084560"
      },
      {
          "cancer_type": "Kidney renal clear cell carcinoma",
          "count": "2379892"
      },
      {
          "cancer_type": "Stomach adenocarcinoma",
          "count": "9399202"
      },
      {
          "cancer_type": "Colon adenocarcinoma",
          "count": "45374532"
      },
      {
          "cancer_type": "Breast invasive carcinoma",
          "count": "4232016"
      },
      {
          "cancer_type": "Lung adenocarcinoma",
          "count": "7723960"
      },
      {
          "cancer_type": "Glioblastoma multiforme",
          "count": "2553742"
      },
      {
          "cancer_type": "Skin Cutaneous Melanoma",
          "count": "15604538"
      },
      {
          "cancer_type": "Bone Cancer",
          "count": "1005538"
      },
      {
          "cancer_type": "Lung squamous cell carcinoma",
          "count": "11954500"
      },
      {
          "cancer_type": "Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
          "count": "755624"
      },
      {
          "cancer_type": "Bladder Urothelial Carcinoma",
          "count": "2631190"
      },
      {
          "cancer_type": "Uterine Corpus Endometrial Carcinoma",
          "count": "13861598"
      },
      {
          "cancer_type": "Liver hepatocellular carcinoma",
          "count": "3696034"
      },
      {
          "cancer_type": "Cervical squamous cell carcinoma and endocervical adenocarcinoma",
          "count": "587206"
      },
      {
          "cancer_type": "Ovarian serous cystadenocarcinoma",
          "count": "1927622"
      },
      {
          "cancer_type": "Kidney Chromophobe",
          "count": "668386"
      },
      {
          "cancer_type": "Prostate adenocarcinoma",
          "count": "204644"
      }
  ]
}
