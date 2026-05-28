const testFetch = async () => {
  try {
    const url = "https://img-ccmbg-1.lefigaro.fr/Gmbfy9_tqNTrTfZAWcr4pbn-Ahc=/1500x/smart/7ac888fc1b6046bba6e2789cd5d9cda6/ccmcms-figaroemploi/32526696.jpg";
    const response = await fetch(url);
    console.log("Fetch success:", response.status);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
};
testFetch();
