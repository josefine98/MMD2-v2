const apiUrl = 'https://josefinej.dk/wp-json/wp/v2/';
const apiUserCredentials = {
    "username": "api.user",
    "password": "4*6J9Pcf%^W6rgqHt54Jji#1"
};

// var forsideId = 6;
const forsideV2Id = 10;
const behandlingerId = 7;
const omMigId = 8;
const kontaktId = 9;
const tagHjaelperMedId = 11;



//Kald af initPage() funktionen, der starter siden op 
initPage();

//Funktionerne initPage() og renderPage() er taget og redigerede fra Gergely István Barsis "Fuldstændig Headless" workshop d. 26/04 2022  
function initPage() {
    //Post request, for at få fat i vores token, da indlæggene i wordpress er sat til at være private og der skal bruges en token til at læse dem 
    fetch(`https://josefinej.dk/wp-json/jwt-auth/v1/token`, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(apiUserCredentials) //JSON streng
    })
        .then(response => response.json()) //Laver responset om til JS objekt som følger JSON format
        .then(jsDataObj => {
            window.localStorage.setItem('authToken', jsDataObj.data.token); //Gemmer vores token i browserens local storage 
            renderPage(); //Sætter siden på
        })
        //Hvis det ikke lykkedes at få fat i et response udskrives en error i consolen 
        .catch(error => {
            console.log(error);
        })
}

//Funktionen renderNav() og renderPage() er inspireret af Dan Høeghs videolektion "MMD - Sem 2, tema 2 - API 1 - lektion på dansk" fra d.14/3 2020
//Link til video: https://www.youtube.com/watch?v=0yci3Geu0bE&ab_channel=DanH%C3%B8egh
//Link til script i projektets Github repository: https://github.com/SpacemanSpiffDK/mmd-API-1-JSON/blob/master/assets/js/script.js 
//renderPage() sætter siden op, ved at kalde på renderNav(), funktionen til den rette side baseret på vinduets URL og RenderFooter()
function renderPage() {
    const url = window.location.href;

    renderNav();

    //Der tjekkes om behandlinger, om, eller kontakt findes i URL'en, hvis ikke kaldes den funktion der laver forsiden (som ikke har et pageId)
    if (url.indexOf('behandlinger') > -1) {
        renderBehandlinger();
    } else if (url.indexOf('om') > -1) {
        renderOm();
    } else if (url.indexOf('kontakt') > -1) {
        renderKontakt();
    } else {
        renderForside2();
    }

    renderFooter();
}

//renderNav() laver HTML'en for headeren og sørger for, at mobilnavigationen virker
function renderNav() {
    let content = `
        <div class="headerImg"></div>

        <div class="navLine">
            <a href="index.html"><p class="logo">Massage v. Susanne Holtze <img class="LillaHjerte" src="assets/images/hjerte.svg" alt="Lilla Hjerte"></p></a>
            <a href="#" id="menu"><i class="fas fa-bars"></i></a> <!-- Burgermenu icon [online] Available at: < https://fontawesome.com/icons/bars?s=solid> [Accessed 10.06.2022] -->

            <nav id="nav">
                <ul>
                    <li><a class="underline" href="index.html">Hjem</a></li>
                    <li><a class="underline" href="index.html?behandlinger">Behandlinger</a></li>
                    <li><a class="underline"href="index.html?om">Om mig</a></li>
                    <li><a class="underline" href="index.html?kontakt">Kontakt</a></li>
                    <li><a class="bookingNav" href="https://massage-v-susanne-holtze.planway.com/?fbclid=IwAR0wgUU0Fr29Ea0_BEDz1FSAOQnyx7umBh9IlRyxQ6-Lhfy2fKJpE3EMZ8k" target="_blank">Booking</a></li>
                    <li class="heartLogoNav"><img class="LillaHjerte" src="assets/images/hjerte.svg" alt="Lilla Hjerte"></li>
                </ul>
            </nav>
        <div>
    `;

    document.querySelector('header').innerHTML = content;

    //Følgende kode er taget og justeret fra Alexandru Bogdans lektion "Mobile First" fra d. 29/11 2021
    var mobileMenu = document.querySelector('#menu');
    var header = document.querySelector('header');

    mobileMenu.addEventListener('click', (event) => {
        event.preventDefault();
        //Hvis menuen er lukket og der klikkes på den tilføjes klassen .opened til headeren, og burgerikonet ændres til et krydsikon 
        if (header.className.indexOf('opened') === -1) {
            header.classList.add('opened');
            // Kryds ikon: Fontawesome https://fontawesome.com/v5.15/icons/times?style=solid 
            mobileMenu.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            header.classList.remove('opened');
            //Burgermenu ikon: Fontawesome https://fontawesome.com/v5.15/icons/bars?style=solid
            mobileMenu.innerHTML = '<i class="fas fa-bars">';
        }
    });
}


//renderForside2() fetcher dataen der skal bruges til at lave forsiden og kalder de funktioner der bruges til at vise indholdet
function renderForside2() {
    //Fetcher posts i kategorien "forsideV2"
    fetch(`${apiUrl}posts?status=private&categories=${forsideV2Id}`, {
        headers: {
            'Authorization': `Bearer ${window.localStorage.getItem("authToken")}`
        }
    })
    .then(response => response.json())
    .then(data => {
        //Fetcher dataen, der bruges i "Jeg kan hjælpe med" sektionen, som er sat ind som et tag i Wordpress
        fetch(`${apiUrl}posts?status=private&tags=${tagHjaelperMedId}`, {
            headers: {
                'Authorization': `Bearer ${window.localStorage.getItem("authToken")}`
            }
        })
        .then(response => response.json())
        .then(treatmentData => {

            //Laver meta titel og description i <head> tagget
            createPageHead(data);

            //laver intro sektionen
            createIntroSection(data);

            //Laver "Jeg kan hjælpe med" sektionen
            createTreatmentsSection(treatmentData);

            //Laver CTA'erne på forsiden
            createCTASection(data);

            //Laver sektionen med anmeldelser fra Facebook
            createReviews();
        })
    })
    .catch(error => {
        console.log(error);
    })
}

//createPageHead() laver den HTML der skal ind i <head> tagget i index.html
function createPageHead(data) {
    let content = `
        <title>${data[0].acf.meta_data.titel}</title>"
        <meta name="description" content="${data[0].acf.meta_data.beskrivelse}">
    `;
    document.querySelector("head").innerHTML += content;
}

//createIntroSection() laver HTML'en til intro sektionen på siden. Den er lavet med henblik på, at funktionen skal kunne bruges
//på de andre sider, derfor tjekkes om intro_citat findes. 
function createIntroSection(data) {
    let content = "";

    //Her tjekkes, om der er et intro objekt med propertien intro_citat
    if (data[0].acf.intro.hasOwnProperty("intro_citat")) {
        content += `
            <article class="introQuote">
                <h4>${data[0].acf.intro.intro_citat}</h4>
            </article>
        `;
    }

    content += `
        <article class="homeAboutArticle">
            <img class="circularImg" src="${data[0].acf.intro.billede}" alt="${data[0].acf.intro.billede.billedetekst}">
            <div>
                <p>${data[0].acf.intro.intro_tekst}</p>
            </div>
        </article>
    `;

    document.querySelector("main").innerHTML += content;
}


//createTreatmentsSection() laver "Jeg kan hjælpe med" sektionen, ved at bruge data fra "kan hjalpe med" tagget
function createTreatmentsSection(treatmentData) {
    let content = "";
    listElement = "";

    content = `
            <section class="treatmentsSection">
                <img src="${treatmentData[0].acf.billede}" alt="Billede af en solnedgang">
                <div class="treatmentsSectionText">
                    <h3>${treatmentData[0].acf.overskrift}</h3>
                    <ul id="treatmentList">
                    </ul>
                    <p>${treatmentData[0].acf.slut_tekst}</p>
                </div>
            </section>
        `;

    document.querySelector("main").innerHTML += content;

    //Går igennem alle punkter og sætter den ind i ul'en i content ovenfor hvis de er udfyldt, og dermed ikke ""
    //Object.values() returnerer et array af objektet punkter's værdier, og der kan derefter laves en for each løkke på arrayet 
    //Inspiration fra: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values 
    Object.values(treatmentData[0].acf.punkter).forEach(punkt => {
        if (punkt != "") {
            listElement = `<li>${punkt}</li>`;
            document.querySelector("#treatmentList").innerHTML += listElement;
        }
    });
}

//createCTASection() laver CTA'erne på forsiden. Object.values() bruges på samme måde som i createTreatmentsSection()
//til at loope over de tre CTA bokse
function createCTASection(data) {
    let content = "";

    content = `
        <section>
            <h4 class="introCitat">${data[0].acf.citat} <br> <img class="LillaHjerte" src="assets/images/hjerte.svg" alt="Lilla Hjerte"></h4>
            <div class="CTASection">
            </div>
        </section>
    `;

    document.querySelector("main").innerHTML += content;

    Object.values(data[0].acf.cta_section).forEach(element => {
        document.querySelector(".CTASection").innerHTML += `
            <a class="homePageCTA" href="index.html?behandlinger">
                <img class="circularImg" src="${element.billede}" alt="Susanne igang med en behandling">
                <h3>${element.overskrift}</h3>
                <p>${element.tekst}</p>
            </a>
        `;
    });
}

//createReviews() opretter et array af reviews og anmeldelser sektionen
//Derefter kaldes showReviewsMobile() og showReviewsDesktop(), som styrer visningen af anmeldelserne 
function createReviews() {
    let content = "";

    //Array af reviews taget fra Facebooks "Indlejr" funktion på anmeldelser 
    //Flyttet for ikke at have for mange globale variable
    let reviews = [
        '<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpermalink.php%3Fstory_fbid%3D7672108286163733%26id%3D100000939134571&show_text=true&width=500" width="500" height="247" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',

        '<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fannechristineblicher.bonnerup%2Fposts%2F10226931049082802&show_text=true&width=500" width="500" height="208" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',

        '<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fpermalink.php%3Fstory_fbid%3D800531127769351%26id%3D100034374123631&show_text=true&width=500" width="500" height="194" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',

        '<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fanette.hechtpedersen.7%2Fposts%2F482451496984085&show_text=true&width=500" width="500" height="194" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>',

        '<iframe src="https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Flaila.sorensen.7%2Fposts%2F10228088327092675&show_text=true&width=500" width="500" height="165" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>'
    ];

    content += `
            <section class="testimonialsSection">
                <h3>Det siger mine kunder om mig</h3>
                <div class="testimonialsDivMobile">
                    <!-- Angle-left ikon: https://fontawesome.com/icons/angle-left?s=solid -->
                    <button id="backBtnMobile"><i class="fa-solid fa-angle-left"></i></button>
                    <section class="reviewSectionMobile"></section>
                    <!-- Angle-right ikon: https://fontawesome.com/icons/angle-right?s=solid -->
                    <button id="forwardBtnMobile"><i class="fa-solid fa-angle-right"></i></button>
                </div>
        
                <div class="testimonialsDivDesktop">
                    <!-- Angle-left ikon: https://fontawesome.com/icons/angle-left?s=solid -->
                    <button id="backBtnDesktop"><i class="fa-solid fa-angle-left"></i></button>
                    <section class="reviewSectionDesktop"></section>
                    <!-- Angle-right ikon: https://fontawesome.com/icons/angle-right?s=solid -->
                    <button id="forwardBtnDesktop"><i class="fa-solid fa-angle-right"></i></button>
                </div>
            </section>
        `;

    document.querySelector('main').innerHTML += content;

    //Funktionskald af showReviewsMobile og showReviewsDesktop - begge kaldes her, men indholdet der vises på siden styres af 
    //media queries i style.css
    showReviewsMobile(reviews);
    showReviewsDesktop(reviews);
}


//showReviewsMobile(reviews) sørger for visningen af anmeldelser på mobilversionen af hjemmesiden
function showReviewsMobile(reviews) {
    var reviewSection = document.querySelector('.reviewSectionMobile');
    var backBtn = document.querySelector('#backBtnMobile');
    var forwardBtn = document.querySelector('#forwardBtnMobile');

    //i repræsenterer indekset af reviews[]. Starter på 0
    let i = 0;
    reviewSection.innerHTML = reviews[i];

    //Når der klikkes på forwardBtn tælles i én op og reviewSections innerHTML ændres til den næste anmeldelse 
    forwardBtn.addEventListener('click', () => {
        i = i + 1;
        reviewSection.innerHTML = reviews[i];
        //Hvis i ender på den sidste anmeldelse fjernes knappen, så der ikke kan trykkes videre ved at sætte display: none på i 
        //style.css
        if (i === reviews.length - 1) {
            forwardBtn.style.display = "none";
        }
        //backBtn styles med display: block, så den altid vises når der er mulighed for at gå tilbage, altså når der er trykket på 
        //forwardBtn knappen
        backBtn.style.display = "block";
    });

    //Her sker det omvendte af ovenstående event listener, hvor i tælles ned i stedet for, og ikke kan gå under 0 
    backBtn.addEventListener('click', () => {
        i = i - 1;
        reviewSection.innerHTML = reviews[i];
        if (i === 0) {
            backBtn.style.display = "none";
        }
        forwardBtn.style.display = "block";
    });
}

//showReviewsDesktop(reviews) sørger for visningen af anmeldelser på mobilversionen af hjemmesiden
//Fungerer på samme måde som showReviewsMobile(reviews), med nogle få justeringer som gennemgås her
function showReviewsDesktop(reviews) {
    var reviewSection = document.querySelector('.reviewSectionDesktop');
    var backBtn = document.querySelector('#backBtnDesktop');
    var forwardBtn = document.querySelector('#forwardBtnDesktop');

    let i = 0;
    //I stedet for at vise det første element vises to 
    reviewSection.innerHTML = reviews[i];
    reviewSection.innerHTML += reviews[i + 1];
    forwardBtn.addEventListener('click', () => {
        i = i + 1;
        //Her vises to elementer i stedet for et, hvor det sidste tælles op
        reviewSection.innerHTML = reviews[i];
        reviewSection.innerHTML += reviews[i + 1];
        if (i + 1 === reviews.length - 1) {
            forwardBtn.style.display = "none";
        }
        backBtn.style.display = "block";
    });

    backBtn.addEventListener('click', () => {
        i = i - 1;
        //Her vises to elementer i stedet for et, hvor det sidste tælles op
        reviewSection.innerHTML = reviews[i];
        reviewSection.innerHTML += reviews[i + 1];
        if (i === 0) {
            backBtn.style.display = "none";
        }
        forwardBtn.style.display = "block";
    });
}


//renderBehandlinger() opretter HTML'en for "Behandlinger" siden og sætter den ind i <main> i index.html
function renderBehandlinger() {
    // Titel og metabeskrivelse til <head>
    let title = "<title>Behandlinger - Massage v. Susanne Holtze</title>";
    document.querySelector("head").innerHTML += title;

    let metaText = `<meta name="description" content="Susanne Holtze tilbyder massage, som lytter til din krop, og behandlingen tager altid udgangspunkt i at møde dig, der hvor du er. ">`
    document.querySelector("head").innerHTML += metaText;

    //Den URL der fetches svarer til kategoriens Id i Wordpress, som vises vha. Reveal IDs pluginet 
    fetch(`${apiUrl}posts?status=private&categories=${behandlingerId}`, {
        headers: {
            'Authorization': `Bearer ${window.localStorage.getItem("authToken")}`
        }

    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            let content = "";

            //Fordi der er ét indlæg i kategorien, svarer det til det første element i data[] arrayet
            //.acf finder vores custom fields i data[]
            //Dernæst bruges navnene på felterne til at få fat i dataen
            content += `
            <h1>${data[0].acf.titel}</h1>    
            <section class="homeAboutArticle">
                <img class="circularImg" src="${data[0].acf.behandlinger_billede.url}" alt="Portrætbillede af Susanne Holtze">
                <div>
                    <p>${data[0].acf.behandlinger_intro_tekst}</p>
                </div>
            </section>

            <p class="behandlingerP">${data[0].acf.priser_intro_tekst}</p>

            <section class="pricesDiv">
                <article class="priceSection">
                    <h3>${data[0].acf.pris_1_titel}</h3>
                    <p>${data[0].acf.pris_1_beskrivelse}</p>
                    <div class="priceDetails">
                        <p class="pricesP">${data[0].acf.pris_1_varighed}</p>
                        <p class="pricesP">${data[0].acf.pris_1_pris}</p>
                        <a class="bookingButton" href="https://massage-v-susanne-holtze.planway.com/?fbclid=IwAR1V2AvGLoyzMIu_S8fvSPdSxQgkZ-lY57lQTrjo8WEDr2oSiLUM-63ocdA" target="_blank">${data[0].acf.pris_1_knap_tekst}</a>
                    </div>
                    
                </article>

                <article class="priceSection">
                    <h3>${data[0].acf.pris_2_titel}</h3>
                    <p>${data[0].acf.pris_2_beskrivelse}</p>
                    <div class="priceDetails">
                        <p class="pricesP">${data[0].acf.pris_2_varighed}</p>
                        <p class="pricesP">${data[0].acf.pris_1_pris}</p>
                        <a class="bookingButton" href="https://massage-v-susanne-holtze.planway.com/?fbclid=IwAR1V2AvGLoyzMIu_S8fvSPdSxQgkZ-lY57lQTrjo8WEDr2oSiLUM-63ocdA" target="_blank">${data[0].acf.pris_2_knap_tekst}</a>
                    </div>
                    
                </article>
            </section>

            <section class="treatmentsSection">
                <img src="${data[0].acf.hjaelper_med_sektion.hjaelper_med_billede.url}" alt="Billede af en solnedgang">
                <div class="treatmentsSectionText">
                    <h3>${data[0].acf.hjaelper_med_sektion.hjaelper_med_overskrift}</h3>
                    <ul>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_1}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_2}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_3}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_4}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_5}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_6}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_7}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_8}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_9}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_10}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_11}</li>
                        <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_12}</li>
                    </ul>
                    <p>${data[0].acf.hjaelper_med_sektion.hjaelper_med_sluttekst}</p>
                </div>
            </section>


            <section class="aboutTreatmentsSection">
                <h2>${data[0].acf.behandlingsformer_titel}</h2>
                <p >${data[0].acf.behandlingsformer_intro_tekst}</p> 
            </section>

            <div class="treatmentsGridWrapper">
                <p class = "treatmentTitle1">${data[0].acf.behandlingsform_1.titel}</p>
                <p class = "treatmentTitle2">${data[0].acf.behandlingsform_2.titel}</p>
                <p class = "treatmentTitle3">${data[0].acf.behandlingsform_3.titel}</p>
                <p class = "treatmentTitle4">${data[0].acf.behandlingsform_4.titel}</p>
                <p class = "treatmentTitle5">${data[0].acf.behandlingsform_5.titel}</p>
                <p class = "treatmentTitle6">${data[0].acf.behandlingsform_6.titel}</p>
                <p class = "treatmentTitle7">${data[0].acf.behandlingsform_7.titel}</p>
                <p class = "treatmentTitle8">${data[0].acf.behandlingsform_8.titel}</p>
                <p class = "treatmentTitle9">${data[0].acf.behandlingsform_9.titel}</p>
            </div>


            <section class="treatmentsSection" id="currentTreatment">
                <div class="treatmentsSectionText">
                    <h3>${data[0].acf.behandlingsform_1.titel}</h3>
                    <p>${data[0].acf.behandlingsform_1.tekst}</p>
                </div>
                <img src="${data[0].acf.behandlingsform_1.billede}" alt="Billede af natur">
            </section>
        `;

            document.querySelector('main').innerHTML += content;

            //Følgende event listeners er ens, og sørger for, at når der klikkes på en knap med en behandlingsform
            //vil de rette elementer blive sat ind i "currentTreatment" sektionen 
            document.querySelector(".treatmentTitle1").addEventListener('click', () => {
                console.log(data[0].acf.behandlingsform_1.billede.url);
                treatment = `<div class="treatmentsSectionText">
            <h3>${data[0].acf.behandlingsform_1.titel}</h3>
            <p>${data[0].acf.behandlingsform_1.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_1.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });

            document.querySelector(".treatmentTitle2").addEventListener('click', () => {
                treatment = `<div class="treatmentsSectionText">
                <h3>${data[0].acf.behandlingsform_2.titel}</h3>
                <p>${data[0].acf.behandlingsform_2.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_2.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });

            document.querySelector(".treatmentTitle3").addEventListener('click', () => {
                treatment = `<div class="treatmentsSectionText">
            <h3>${data[0].acf.behandlingsform_3.titel}</h3>
            <p>${data[0].acf.behandlingsform_3.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_3.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });

            document.querySelector(".treatmentTitle4").addEventListener('click', () => {
                treatment = `<div class="treatmentsSectionText">
            <h3>${data[0].acf.behandlingsform_4.titel}</h3>
            <p>${data[0].acf.behandlingsform_4.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_4.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });

            document.querySelector(".treatmentTitle5").addEventListener('click', () => {
                treatment = `<div class="treatmentsSectionText">
            <h3>${data[0].acf.behandlingsform_5.titel}</h3>
            <p>${data[0].acf.behandlingsform_5.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_5.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });

            document.querySelector(".treatmentTitle6").addEventListener('click', () => {
                treatment = `<div class="treatmentsSectionText">
            <h3>${data[0].acf.behandlingsform_6.titel}</h3>
            <p>${data[0].acf.behandlingsform_6.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_6.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });

            document.querySelector(".treatmentTitle7").addEventListener('click', () => {
                treatment = `<div class="treatmentsSectionText">
            <h3>${data[0].acf.behandlingsform_7.titel}</h3>
            <p>${data[0].acf.behandlingsform_7.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_7.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });

            document.querySelector(".treatmentTitle8").addEventListener('click', () => {
                treatment = `<div class="treatmentsSectionText">
            <h3>${data[0].acf.behandlingsform_8.titel}</h3>
            <p>${data[0].acf.behandlingsform_8.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_8.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });

            document.querySelector(".treatmentTitle9").addEventListener('click', () => {
                treatment = `<div class="treatmentsSectionText">
            <h3>${data[0].acf.behandlingsform_9.titel}</h3>
            <p>${data[0].acf.behandlingsform_9.tekst}</p>
            </div>
            <img src="${data[0].acf.behandlingsform_9.billede}" alt="Billede af natur"></img>`;
                document.querySelector("#currentTreatment").innerHTML = treatment;
            });
        })
        .catch(error => {
            console.log(error);
        })
}


//renderOm() opretter HTML'en for "Om" siden og sætter den ind i index.html når funktionen kaldes
function renderOm() {
    let title = "<title>Om mig - Massage v. Susanne Holtze</title>";
    document.querySelector("head").innerHTML += title;
    let metaText = `<meta name="description" content="Susanne Holtze tilbyder massage, som lytter til din krop, og behandlingen tager altid udgangspunkt i at møde dig, der hvor du er. ">`
    document.querySelector("head").innerHTML += metaText;

    fetch(`${apiUrl}posts?status=private&categories=${omMigId}`, {
        headers: {
            'Authorization': `Bearer ${window.localStorage.getItem("authToken")}`
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            let content = "";

            content += `
            <h1>${data[0].acf.om_titel}</h1>

            <section class="homeAboutArticle">
                <img class="circularImg" src="${data[0].acf.om_billede.url}" alt="Portrætbillede af Susanne Holtze">
                <div>
                    <p>${data[0].acf.om_intro_tekst}</p>
                </div>
            </section>

            <section class="treatmentsSection">
                <img src="${data[0].acf.sektion_1_billede.url}" alt="Billede af en sø i en skov, med båd i vandet">
                <div class="treatmentsSectionText">
                    <h3>${data[0].acf.sektion_1_titel}</h3>
                    <p>${data[0].acf.sektion_1_tekst}</p>
                </div>
            </section>

            <section class="treatmentsSection">
                <img src="${data[0].acf.sektion_2_billede.url}" alt="Billede af briksen i klinikken">
                <div class="treatmentsSectionText">
                    <h3>${data[0].acf.sektion_2_titel}</h3>
                    <p>${data[0].acf.sektion_2_tekst}</p>
                </div>
            </section>

            <section class="testimonialsSection">
                <h3>${data[0].acf.anmeldelser_titel}</h3>
                <div class="testimonialsDivMobile">
                    <!-- Angle-left ikon: https://fontawesome.com/icons/angle-left?s=solid -->
                    <button id="backBtnMobile"><i class="fa-solid fa-angle-left"></i></button>
                    <section class="reviewSectionMobile"></section>
                    <!-- Angle-right ikon: https://fontawesome.com/icons/angle-right?s=solid -->
                    <button id="forwardBtnMobile"><i class="fa-solid fa-angle-right"></i></button>
                </div>
        
                <div class="testimonialsDivDesktop">
                    <!-- Angle-left ikon: https://fontawesome.com/icons/angle-left?s=solid -->
                    <button id="backBtnDesktop"><i class="fa-solid fa-angle-left"></i></button>
                    <section class="reviewSectionDesktop"></section>
                    <!-- Angle-right ikon: https://fontawesome.com/icons/angle-right?s=solid -->
                    <button id="forwardBtnDesktop"><i class="fa-solid fa-angle-right"></i></button>
                </div>
            </section>

            <section class="educationSection">
                <h2>${data[0].acf.faglig_profil_titel}</h2>
                <div class="educationText">
                    <div class="educationTextDiv">
                        <p>${data[0].acf.faglig_profil_tekst_1}</p>
                    </div>
                    <div class="educationTextDiv">
                        <p>${data[0].acf.faglig_profil_tekst_2}</p>
                    </div>
                    <div class="educationTextDiv">
                        <p>${data[0].acf.faglig_profil_tekst_3}</p>
                    </div>
                </div>
            </section>

            <h3>${data[0].acf.kurser_titel}</h3>
            <section class="coursesSection">
                <div class="nordlysCourses">
                    <ul class="yearColumn">
                        <li>${data[0].acf.nordlys_kurser.kursus_1.aarstal}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_2.aarstal}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_3.aarstal}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_4.aarstal}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_5.aarstal}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_6.aarstal}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_7.aarstal}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_8.aarstal}</li>
                    </ul>
                    <ul>
                        <li>${data[0].acf.nordlys_kurser.kursus_1.titel}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_2.titel}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_3.titel}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_4.titel}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_5.titel}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_6.titel}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_7.titel}</li>
                        <li>${data[0].acf.nordlys_kurser.kursus_8.titel}</li>
                        <li>${data[0].acf.nordlys_kurser.nordlys_sluttekst}</li>
                    </ul>
                </div>

                <div class="kstCourses">
                    <ul class="yearColumn">
                        <li>${data[0].acf.kst_kurser.kursus_1.aarstal}</li>
                        <li>${data[0].acf.kst_kurser.kursus_2.aarstal}</li>
                        <li>${data[0].acf.kst_kurser.kursus_3.aarstal}</li>
                        <li>${data[0].acf.kst_kurser.kursus_4.aarstal}</li>
                        <li>${data[0].acf.kst_kurser.kursus_5.aarstal}</li>
                        <li>${data[0].acf.kst_kurser.kursus_6.aarstal}</li>
                    </ul>

                    <ul>
                        <li>${data[0].acf.kst_kurser.kursus_1.titel}</li>
                        <li>${data[0].acf.kst_kurser.kursus_3.titel}</li>
                        <li>${data[0].acf.kst_kurser.kursus_4.titel}</li>
                        <li>${data[0].acf.kst_kurser.kursus_5.titel}</li>
                        <li>${data[0].acf.kst_kurser.kursus_6.titel}</li>
                        <li>${data[0].acf.kst_kurser.kst_sluttekst}</li>
                    </ul>
                </div>
            </section>
        `;

            document.querySelector('main').innerHTML += content;

            //Funktionskald af showReviewsMobile og showReviewsDesktop - begge kaldes her, men indholdet der vises på siden styres af 
            //media queries i style.css
            showReviewsMobile(reviews);
            showReviewsDesktop(reviews);
        })

        .catch(error => {
            console.log(error);
        })
}

//renderKontakt() opretter HTML til "Kontakt" siden og sætter det ind i <main> i index.html
function renderKontakt() {
    let title = "<title>Kontakt - Massage v. Susanne Holtze</title>";
    document.querySelector("head").innerHTML += title;
    let metaText = `<meta name="description" content="Susanne Holtze tilbyder massage, som lytter til din krop, og behandlingen tager altid udgangspunkt i at møde dig, der hvor du er. ">`
    document.querySelector("head").innerHTML += metaText;

    fetch(`${apiUrl}posts?status=private&categories=${kontaktId}`, {
        headers: {
            'Authorization': `Bearer ${window.localStorage.getItem("authToken")}`
        }
    })
        .then(response => response.json())

        .then(data => {
            console.log(data);
            let content = "";

            content += `
            <h1>${data[0].acf.kontakt_titel}</h1>
            <h4 class="introQuote">${data[0].acf.kontakt_intro_tekst}</h4>

            <section class="contactArticle">
                <article class="kontaktInfo">
                    <i class="fa-solid fa-phone"></i> <!--Phone icon [online] Available at:< https://fontawesome.com/icons/phone?s=solid> [Accessed 10.06.2022] -->
                    <h3>${data[0].acf.telefon.overskrift}</h3>
                    <p>${data[0].acf.telefon.indhold}</p>
                </article>

                <article class="kontaktInfo">
                    <i class="fa-solid fa-clock"></i> <!-- Clock icon [online] Available at:< https://fontawesome.com/icons/clock?s=solid> [Accessed 10.06.2022]  -->
                    <h3>${data[0].acf.aabningstider.overskrift}</h3>
                    <p>${data[0].acf.aabningstider.indhold}</p>
                </article>

                <article class="kontaktInfo">
                    <i class="fa-solid fa-location-dot"></i> <!-- Location-dot icon [online] Available at:< https://fontawesome.com/icons/location-dot?s=solid> [Accessed 10.06.2022]  -->
                    <h3>${data[0].acf.adresse.overskrift}</h3>
                    <p>${data[0].acf.adresse.indhold}</p>
                </article>

                <article class="kontaktInfo">
                    <i class="fa-brands fa-facebook-f"></i> <!-- Facebook icon [online] Available at:<https://fontawesome.com/icons/facebook-f?s=brands> [Accessed 10.06.2022]  -->
                    <h3>${data[0].acf.foelg_mig.overskrift}</h3>
                    <p>${data[0].acf.foelg_mig.indhold}</p>    
                </article>
            </section>

            <p>${data[0].acf.kontakt_info_tekst}</p>

            <section class="contactBoxSection">
                <div class="contactBoxes">
                    <h4>${data[0].acf.book_her_boks.tekst}</h4>
                    <a class="bookingButton" href="https://massage-v-susanne-holtze.planway.com/?fbclid=IwAR1V2AvGLoyzMIu_S8fvSPdSxQgkZ-lY57lQTrjo8WEDr2oSiLUM-63ocdA" target="_blank">${data[0].acf.book_her_boks.knap_tekst}</a>
                </div>
                
                <div id="map">
                    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2154.2648096370626!2d9.855172815991963!3d57.32040618100155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4648d7172b0788c9%3A0x54d00fa495c15b2a!2sL%C3%B8kkenvej%20365%2C%209700%20Br%C3%B8nderslev!5e0!3m2!1sda!2sdk!4v1655355234517!5m2!1sda!2sdk" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe> 
                </div>
            </section>
        `;

            document.querySelector('main').innerHTML += content;
        })

        .catch(error => {
            console.log(error);
        })
}

// //renderForside() opretter HTML til forsiden og sætter det ind i <main> i index.html
// function renderForside() {
//     let title = "<title>Massage v. Susanne Holtze</title>";
//     document.querySelector("head").innerHTML += title;
//     let metaText = `<meta name="description" content="Susanne Holtze tilbyder massage,
//         som lytter til din krop, og behandlingen tager altid udgangspunkt i at møde dig, der hvor du er. ">`
//     document.querySelector("head").innerHTML += metaText;

//     fetch(`${apiUrl}posts?status=private&categories=${forsideId}`, {
//         headers: {
//             'Authorization': `Bearer ${window.localStorage.getItem("authToken")}`
//         }
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log(data);
//         let content = "";
//         content += `
//             <article class="introQuote">
//                 <h4>${data[0].acf.intro_citat}</h4>
//             </article>

//             <article class="homeAboutArticle">
//                 <img class="circularImg" src="${data[0].acf.susanne_billede.url}" alt="Portrætbillede af Susanne Holtze">
//                 <div>
//                     <p>${data[0].acf.intro_tekst}</p>
//                 </div>
//             </article>

//             <section class="treatmentsSection">
//                 <img src="${data[0].acf.hjaelper_med_sektion.hjaelper_med_billede.url}" alt="Billede af en solnedgang">
//                 <div class="treatmentsSectionText">
//                     <h3>${data[0].acf.hjaelper_med_sektion.hjaelper_med_overskrift}</h3>
//                     <ul>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_1}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_2}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_3}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_4}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_5}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_6}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_7}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_8}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_9}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_10}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_11}</li>
//                         <li>${data[0].acf.hjaelper_med_sektion.hjaelper_med_12}</li>
//                     </ul>
//                     <p>${data[0].acf.hjaelper_med_sektion.hjaelper_med_sluttekst}</p>
//                 </div>
//             </section>

//             <section>
//                 <h4 class="introCitat">${data[0].acf.cta_intro_citat} <br> <img class="LillaHjerte" src="assets/images/hjerte.svg" alt="Lilla Hjerte"></h4>

//                 <div class="CTASection">
//                     <a class="homePageCTA" href="index.html?behandlinger">
//                         <img class="circularImg" src="${data[0].acf.cta_1_billede.url}" alt="Susanne igang med en behandling">
//                         <h3>${data[0].acf.cta_1_overskrift}</h3>
//                         <p>${data[0].acf.cta_1_beskrivelse}</p>
//                     </a>

//                     <a class="homePageCTA" href="index.html?om">
//                         <img class="circularImg" src="${data[0].acf.cta_2_billede.url}" alt="Lyserøde rhododendron blomster">
//                         <h3>${data[0].acf.cta_2_overskrift}</h3>
//                         <p>${data[0].acf.cta_2_beskrivelse}</p>
//                     </a>

//                     <a class="homePageCTA" href="index.html?kontakt">
//                         <img class="circularImg" src="${data[0].acf.cta_3_billede.url}" alt="Billede af en solnedgang ved Løkken mole">
//                         <h3>${data[0].acf.cta_3_overskrift}</h3>
//                         <p>${data[0].acf.cta_3_beskrivelse}</p>
//                     </a>
//                 </div>
//             </section>

//             <section class="testimonialsSection">
//                 <h3>${data[0].acf.anmeldelser_overskrift}</h3>
//                 <div class="testimonialsDivMobile">
//                     <!-- Angle-left ikon: https://fontawesome.com/icons/angle-left?s=solid -->
//                     <button id="backBtnMobile"><i class="fa-solid fa-angle-left"></i></button>
//                     <section class="reviewSectionMobile"></section>
//                     <!-- Angle-right ikon: https://fontawesome.com/icons/angle-right?s=solid -->
//                     <button id="forwardBtnMobile"><i class="fa-solid fa-angle-right"></i></button>
//                 </div>

//                 <div class="testimonialsDivDesktop">
//                     <!-- Angle-left ikon: https://fontawesome.com/icons/angle-left?s=solid -->
//                     <button id="backBtnDesktop"><i class="fa-solid fa-angle-left"></i></button>
//                     <section class="reviewSectionDesktop"></section>
//                     <!-- Angle-right ikon: https://fontawesome.com/icons/angle-right?s=solid -->
//                     <button id="forwardBtnDesktop"><i class="fa-solid fa-angle-right"></i></button>
//                 </div>
//             </section>
//         `;

//         document.querySelector('main').innerHTML += content;

//         //Funktionskald af showReviewsMobile og showReviewsDesktop - begge kaldes her, men indholdet der vises på siden styres af 
//         //media queries i style.css
//         showReviewsMobile(reviews);
//         showReviewsDesktop(reviews);
//     })

//     .catch(error => {
//         console.log(error);
//     })
// }



//renderFooter() opretter HTML til footeren og sætter det ind i <footer> i index.html
function renderFooter() {
    let content = `
        <a href="index.html"><p class="logo">Massage v. Susanne Holtze <img class="LillaHjerte" src="assets/images/hjerte.svg" alt="Lilla Hjerte"></p> </a>
        
        <div class="footerColumns">
            <div class="footerColumn">
                <section class="footerSection">
                    <i class="fa-solid fa-phone"></i>
                    <h3>Telefon</h3> <!--Phone icon [online] Available at:< https://fontawesome.com/icons/phone?s=solid> [Accessed 10.06.2022] -->
                    <p>+45 25 82 52 25</p>
                </section>

                <section class="footerSection">
                    <i class="fa-solid fa-clock"></i>
                    <h3>Åbningstider</h3> <!-- Clock icon [online] Available at:< https://fontawesome.com/icons/clock?s=solid> [Accessed 10.06.2022]  -->
                    <p>Mandag-Torsdag</p>
                    <p>9.00 - 15.00</p>
                    <p>Fredag</p>
                    <p>9.00 - 12.00</p>
                </section>
            </div>

            <div class="footerColumn">
                <section class="footerSection">
                    <i class="fa-brands fa-facebook-f"></i>
                    <h3>Følg mig</h3><!-- Facebook icon [online] Available at:<https://fontawesome.com/icons/facebook-f?s=brands> [Accessed 10.06.2022]  -->
                    <p>Massage v. Susanne Holtze</p>
                </section>
                
                <section class="footerSection">
                    <i class="fa-solid fa-location-dot"></i>
                    <h3>Adresse</h3><!-- Location-dot icon [online] Available at:< https://fontawesome.com/icons/location-dot?s=solid> [Accessed 10.06.2022]  -->
                    <p>Løkkenvej 365</p>
                    <p>9700 Brønderslev</p>
                </section>
            </div>

            <div class="footerColumn">
                <h3>Kort</h3>
                <div id="map">
                <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2154.264808523518!2d9.8573615!3d57.3204062!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4648d7172b0788c9%3A0x54d00fa495c15b2a!2sL%C3%B8kkenvej%20365%2C%209700%20Br%C3%B8nderslev!5e0!3m2!1sda!2sdk!4v1655408465031!5m2!1sda!2sdk" width="400" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                </div>
            </div>
        </div>
        
        <p class="cvr">CVR 43165321</p>
    `;
    document.querySelector('footer').innerHTML += content;
}


