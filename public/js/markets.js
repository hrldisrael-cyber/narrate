const trending = [
{
name:"BONK",
price:"0.000041",
change:"+12.4%"
},
{
name:"USELESS",
price:"0.018",
change:"+34.2%"
},
{
name:"WIF",
price:"2.15",
change:"-2.3%"
}
];

const container =
document.getElementById("trending");

trending.forEach(token=>{

container.innerHTML+=`

<div class="market-card">

<h3>$${token.name}</h3>

<p>$${token.price}</p>

<span>${token.change}</span>

</div>

`;

});
