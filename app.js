(function () {
  "use strict";

  const QUESTION_URL = "questions.json";
  const LETTERS = ["A", "B", "C", "D"];
  const NEXT_DELAY_CORRECT = 850;
  const NEXT_DELAY_WRONG = 1700;
  const DIFFICULTIES = {
    basic: "Basic",
    intermediate: "Intermediate",
    advanced: "Advanced"
  };
  const STORAGE_KEY = "beanCounterQuizSession";
  const MILESTONES = {
    5:   "5 correct answers! You're building real momentum.",
    10:  "10 correct answers! Great financial know-how.",
    25:  "25 correct answers! You're on a roll.",
    50:  "50 correct answers! Impressive dedication.",
    100: "100 correct answers! Financial literacy champion!"
  };

  const CHARITY_KEY = "faaSelectedCharity";
  const IMPACT_EVENTS_KEY = "faaImpactEvents";

  const SUPABASE_URL = "https://wuofhyiliyzysnbntpij.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1b2ZoeWlsaXl6eXNuYm50cGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjQzMDAsImV4cCI6MjA5NzIwMDMwMH0.EyFdHi7LvLHS9dG4vN0PR1-IYx7ybrOZYKY2UcGIhAE";
  let db = null;
  try { db = window.supabase && window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) {}

  const CHARITIES = {
    rice: {
      label: "Rice",
      tag: "Rice donations",
      unit: "grain",
      unitPlural: "grains",
      perAnswer: 10,
      cap: 260,
      scene: "rice",
      emptyTitle: "The rice bowl is waiting.",
      activeTitle: "Rice is filling the bowl.",
      description: "Each correct answer adds ten grains of rice to the donation bowl."
    },
    beans: {
      label: "Beans",
      tag: "Bean donations",
      unit: "bean",
      unitPlural: "beans",
      perAnswer: 1,
      cap: 120,
      scene: "beans",
      emptyTitle: "The bean bowl is waiting.",
      activeTitle: "Beans are filling the bowl.",
      description: "Each correct answer drops one shaded bean into the ceramic bowl."
    },
    kibble: {
      label: "Kibble",
      tag: "Shelter animal meals",
      unit: "kibble piece",
      unitPlural: "kibble pieces",
      perAnswer: 1,
      cap: 120,
      scene: "kibble",
      emptyTitle: "The dog bowl is waiting.",
      activeTitle: "Kibble is filling the dog bowl.",
      description: "Each correct answer adds one textured piece of kibble for shelter animals."
    },
    ocean: {
      label: "Ocean Plastic Cleanup",
      tag: "Ocean cleanup",
      unit: "plastic item",
      unitPlural: "plastic items",
      perAnswer: 1,
      cap: 110,
      scene: "ocean",
      emptyTitle: "The cleanup bag is ready.",
      activeTitle: "Plastic is being collected.",
      description: "Each correct answer adds a recovered plastic item into the mesh cleanup bag."
    },
    trees: {
      label: "Plant Trees",
      tag: "Tree planting",
      unit: "growth point",
      unitPlural: "growth points",
      perAnswer: 1,
      cap: 100,
      scene: "trees",
      emptyTitle: "A seedling is ready.",
      activeTitle: "A tree is growing.",
      description: "Each correct answer grows the current seedling. Every 100 correct answers plants a tree."
    }
  };
  const FALLBACK_QUESTIONS = [{"id":1,"difficulty":"intermediate","category":"Tax Basics","question":"What is the standard deduction?","choices":["A set amount that reduces taxable income if you do not itemize deductions","A credit that directly reduces your tax bill dollar for dollar","A fee charged by the IRS for filing online","The amount every taxpayer must pay before credits"],"answer":0},{"id":2,"difficulty":"intermediate","category":"Tax Basics","question":"Which choice best describes itemizing deductions?","choices":["Listing eligible deductible expenses instead of taking the standard deduction","Listing every purchase you made during the year","Filing taxes separately from your spouse","Paying all taxes before April"],"answer":0},{"id":3,"difficulty":"intermediate","category":"Tax Basics","question":"A tax credit usually helps you by doing what?","choices":["Reducing your tax bill directly","Increasing your taxable income","Replacing the need to file a tax return","Changing your filing status automatically"],"answer":0},{"id":4,"difficulty":"intermediate","category":"Tax Basics","question":"A tax deduction usually helps you by doing what?","choices":["Reducing the income that is subject to tax","Increasing the amount of Social Security tax you owe","Letting you skip estimated payments","Making all income tax-free"],"answer":0},{"id":5,"difficulty":"intermediate","category":"Filing Status","question":"Which filing status is generally for an unmarried person who does not qualify for another status?","choices":["Single","Head of Household","Married Filing Jointly","Qualifying Surviving Spouse"],"answer":0},{"id":6,"difficulty":"intermediate","category":"Filing Status","question":"Which filing status may be available to an unmarried person who pays more than half the cost of keeping up a home for a qualifying person?","choices":["Head of Household","Married Filing Separately","Single Only","Dependent Filer"],"answer":0},{"id":7,"difficulty":"intermediate","category":"Filing Status","question":"For many married couples, what is one common benefit of filing jointly?","choices":["They combine income and deductions on one return","They never owe taxes","They do not need Social Security numbers","They cannot receive a refund"],"answer":0},{"id":8,"difficulty":"intermediate","category":"Tax Forms","question":"What form do most employees receive from an employer showing wages and tax withheld?","choices":["Form W-2","Form 1099-NEC","Form 1098-T","Schedule C"],"answer":0},{"id":9,"difficulty":"intermediate","category":"Tax Forms","question":"What form is commonly used to report nonemployee compensation for independent contractors?","choices":["Form 1099-NEC","Form W-4","Form W-2","Form 1095-A"],"answer":0},{"id":10,"difficulty":"intermediate","category":"Tax Forms","question":"What is the main purpose of Form W-4?","choices":["To tell an employer how much federal income tax to withhold from pay","To report mortgage interest paid","To claim business mileage after year-end","To request an extension from the IRS"],"answer":0},{"id":11,"difficulty":"advanced","category":"Self-Employment","question":"If you are self-employed, which taxes may you generally need to plan for?","choices":["Income tax and self-employment tax","Only sales tax","Only property tax","No taxes until retirement"],"answer":0},{"id":12,"difficulty":"advanced","category":"Self-Employment","question":"What does self-employment tax mainly cover?","choices":["Social Security and Medicare taxes","State sales tax","Property taxes on business equipment","Credit card processing fees"],"answer":0},{"id":13,"difficulty":"advanced","category":"Estimated Taxes","question":"Who may need to make estimated tax payments?","choices":["Someone with income that does not have enough tax withheld","Only people who own a home","Only retirees over age 75","Anyone who receives a W-2"],"answer":0},{"id":14,"difficulty":"advanced","category":"Estimated Taxes","question":"Estimated tax payments are commonly paid how often?","choices":["Quarterly","Every day","Once every ten years","Only after receiving a refund"],"answer":0},{"id":15,"difficulty":"intermediate","category":"Deductions","question":"Which expense is commonly deductible for a qualifying self-employed business?","choices":["Ordinary and necessary business supplies","All groceries for the household","Personal vacations","Clothing worn outside work with no business requirement"],"answer":0},{"id":16,"difficulty":"intermediate","category":"Deductions","question":"Which statement about charitable donations is generally true?","choices":["They may help if you itemize deductions and have proper records","They are always refunded in full","They replace all income taxes","They are deductible only if paid in cash"],"answer":0},{"id":17,"difficulty":"intermediate","category":"Deductions","question":"Which record is helpful if you want to claim business mileage?","choices":["A mileage log showing dates, purpose, and miles","A guess at the end of the year","Only a photo of your car","A list of personal errands"],"answer":0},{"id":18,"difficulty":"intermediate","category":"Deductions","question":"What does the home office deduction generally require?","choices":["A space used regularly and exclusively for business","Any couch where you sometimes check email","A room with a television","Owning your home outright"],"answer":0},{"id":19,"difficulty":"intermediate","category":"Retirement","question":"What is one basic purpose of an IRA?","choices":["To save for retirement with possible tax advantages","To replace an emergency fund","To avoid filing a tax return","To pay monthly utility bills automatically"],"answer":0},{"id":20,"difficulty":"intermediate","category":"Retirement","question":"What is a 401(k)?","choices":["A workplace retirement savings plan","A type of checking account","A credit score report","A property tax bill"],"answer":0},{"id":21,"difficulty":"intermediate","category":"Retirement","question":"What does an employer match in a 401(k) usually mean?","choices":["The employer contributes extra money based on your contributions","The employer pays your rent","Your taxes are permanently erased","Your paycheck cannot change"],"answer":0},{"id":22,"difficulty":"intermediate","category":"Retirement","question":"Traditional retirement contributions often help by doing what?","choices":["Reducing taxable income now, with taxes generally paid later","Making withdrawals tax-free at any age for any reason","Eliminating payroll taxes","Guaranteeing investment gains"],"answer":0},{"id":23,"difficulty":"intermediate","category":"Retirement","question":"Roth IRA contributions are generally made with what kind of dollars?","choices":["After-tax dollars","Untaxed payroll dollars only","Employer-only dollars","Property tax credits"],"answer":0},{"id":24,"difficulty":"intermediate","category":"Retirement","question":"Why is starting retirement saving early powerful?","choices":["More time allows compound growth to work","Early savers never experience market losses","It removes the need for health insurance","It guarantees a specific retirement age"],"answer":0},{"id":25,"difficulty":"basic","category":"Personal Finance","question":"What is an emergency fund?","choices":["Money set aside for unexpected expenses or income disruptions","A credit card used for vacations","A loan that never has to be repaid","Money invested only in risky assets"],"answer":0},{"id":26,"difficulty":"basic","category":"Personal Finance","question":"A common beginner goal for an emergency fund is to save what first?","choices":["A small starter cushion before building several months of expenses","Exactly one year of luxury spending immediately","Only enough for a restaurant meal","Nothing if you have a debit card"],"answer":0},{"id":27,"difficulty":"basic","category":"Personal Finance","question":"What is compound interest?","choices":["Interest earned on both the original money and earlier interest","Interest charged only once in a lifetime","A fee for opening a bank account","A tax on grocery purchases"],"answer":0},{"id":28,"difficulty":"basic","category":"Personal Finance","question":"Which habit usually helps build savings?","choices":["Pay yourself first by setting money aside before spending the rest","Spend every raise immediately","Use savings only for impulse purchases","Ignore bank balances"],"answer":0},{"id":29,"difficulty":"basic","category":"Credit","question":"Which factor commonly affects your credit score?","choices":["Payment history","Your favorite grocery store","Your shoe size","The color of your debit card"],"answer":0},{"id":30,"difficulty":"basic","category":"Credit","question":"What is credit utilization?","choices":["How much credit you are using compared with your available credit","The number of checks you write","The amount of cash in your wallet","Your annual property tax rate"],"answer":0},{"id":31,"difficulty":"basic","category":"Credit","question":"Which action can hurt a credit score?","choices":["Paying bills late","Checking your own credit report","Using a budget","Saving for emergencies"],"answer":0},{"id":32,"difficulty":"basic","category":"Credit","question":"What does APR stand for in borrowing?","choices":["Annual Percentage Rate","Automatic Payroll Refund","Average Purchase Receipt","Annual Property Record"],"answer":0},{"id":33,"difficulty":"basic","category":"Budgeting","question":"What is a budget?","choices":["A plan for how income will be spent, saved, and used","A list of only tax forms","A way to avoid tracking money","A guarantee that prices will not rise"],"answer":0},{"id":34,"difficulty":"basic","category":"Budgeting","question":"Which is an example of a fixed expense?","choices":["Rent or mortgage payment","Random entertainment spending","Impulse snacks","Unplanned gifts"],"answer":0},{"id":35,"difficulty":"basic","category":"Budgeting","question":"Which is an example of a variable expense?","choices":["Groceries that change from month to month","A fixed monthly rent payment","A set insurance premium that never changes","A scheduled loan payment"],"answer":0},{"id":36,"difficulty":"basic","category":"Banking","question":"What is the main purpose of a checking account?","choices":["Everyday payments and access to money","Long-term investing only","Avoiding all taxes","Replacing a credit score"],"answer":0},{"id":37,"difficulty":"basic","category":"Banking","question":"What is the main purpose of a savings account?","choices":["Holding money for goals or emergencies with easy access","Borrowing money at high interest","Filing a tax return","Reporting contractor income"],"answer":0},{"id":38,"difficulty":"basic","category":"Banking","question":"What does FDIC insurance generally protect?","choices":["Deposits at covered banks up to legal limits","Stock market investments from losses","The value of a used car","Credit card rewards points"],"answer":0},{"id":39,"difficulty":"intermediate","category":"Investing","question":"What is diversification?","choices":["Spreading investments across different assets to reduce risk","Putting all money into one company","Avoiding savings entirely","Borrowing to pay every bill"],"answer":0},{"id":40,"difficulty":"intermediate","category":"Investing","question":"Which statement about investing is generally true?","choices":["Higher potential returns often come with higher risk","All investments are guaranteed by the IRS","Stocks never lose value","Risk disappears if you ignore statements"],"answer":0},{"id":41,"difficulty":"intermediate","category":"Investing","question":"What is an index fund designed to do?","choices":["Track a market index or segment","Guarantee no losses","Pay your tax bill directly","Replace your bank account"],"answer":0},{"id":42,"difficulty":"basic","category":"Insurance","question":"What is an insurance deductible?","choices":["The amount you pay before insurance starts covering certain costs","A tax credit for every policy","A refund from your employer","A bank fee for deposits"],"answer":0},{"id":43,"difficulty":"basic","category":"Insurance","question":"Why do people buy insurance?","choices":["To help manage the financial risk of unexpected events","To make every purchase tax-free","To avoid budgeting","To guarantee investment profits"],"answer":0},{"id":44,"difficulty":"basic","category":"Debt","question":"Which debt payoff approach focuses on the smallest balance first?","choices":["Debt snowball","Debt avalanche","Payroll withholding","Standard deduction"],"answer":0},{"id":45,"difficulty":"basic","category":"Debt","question":"Which debt payoff approach focuses on the highest interest rate first?","choices":["Debt avalanche","Debt snowball","Itemized deduction","Roth conversion"],"answer":0},{"id":46,"difficulty":"basic","category":"Debt","question":"Why can making only minimum payments on a credit card be costly?","choices":["Interest can keep adding up for a long time","It always increases your income","It removes all fees forever","It turns debt into a tax refund"],"answer":0},{"id":47,"difficulty":"intermediate","category":"Tax Myths","question":"If you get a tax refund, what does it usually mean?","choices":["You paid in more tax than you owed during the year","The IRS gave you a bonus unrelated to taxes","You never paid any tax","Your income was not taxable"],"answer":0},{"id":48,"difficulty":"intermediate","category":"Tax Myths","question":"Is all income tax-free if you are paid in cash?","choices":["No, taxable income generally stays taxable even if paid in cash","Yes, cash income is never reported","Yes, but only on weekends","No, cash income is taxed twice automatically"],"answer":0},{"id":49,"difficulty":"intermediate","category":"Tax Myths","question":"If you file for a tax extension, what is extended?","choices":["The time to file the return, not usually the time to pay","The time to pay with no interest forever","The deadline for every bill you owe","The year in which you earned income"],"answer":0},{"id":50,"difficulty":"intermediate","category":"Tax Myths","question":"Does earning more money always mean you take home less because of tax brackets?","choices":["No, only the income in each bracket is taxed at that bracket's rate","Yes, every raise reduces take-home pay","Yes, tax brackets apply backward to prior years","No, tax brackets only apply to businesses"],"answer":0},{"id":51,"difficulty":"intermediate","category":"Tax Basics","question":"What does taxable income mean?","choices":["Income left after certain deductions and adjustments are applied","Every dollar you ever receive with no exceptions","Only money kept in a savings account","Only income from selling a house"],"answer":0},{"id":52,"difficulty":"intermediate","category":"Tax Basics","question":"What is withholding?","choices":["Tax taken from pay during the year and sent to tax agencies","Money hidden from a bank statement","A fee for using tax software","A refund paid before you file"],"answer":0},{"id":53,"difficulty":"intermediate","category":"Tax Records","question":"Why should you keep tax records and receipts?","choices":["They support income, deductions, credits, and other tax positions","They make all expenses deductible","They guarantee a refund","They replace the need to file"],"answer":0},{"id":54,"difficulty":"intermediate","category":"Tax Records","question":"Which document may show mortgage interest paid during the year?","choices":["Form 1098","Form W-4","Form 1099-NEC","Schedule SE only"],"answer":0},{"id":55,"difficulty":"intermediate","category":"Tax Records","question":"What form may students receive showing tuition paid or billed?","choices":["Form 1098-T","Form W-2G only","Form W-9","Form 941"],"answer":0},{"id":56,"difficulty":"intermediate","category":"Income","question":"Which type of income is commonly reported on a W-2?","choices":["Employee wages","Only stock dividends","Only rental income","Only cash gifts from relatives"],"answer":0},{"id":57,"difficulty":"intermediate","category":"Income","question":"What are capital gains?","choices":["Profit from selling an asset for more than you paid","Money withheld from a paycheck","A fee for opening a brokerage account","A standard deduction amount"],"answer":0},{"id":58,"difficulty":"intermediate","category":"Income","question":"Which income is commonly reported on Form 1099-INT?","choices":["Interest income","Employee wages","Mortgage interest paid","Health insurance coverage"],"answer":0},{"id":59,"difficulty":"advanced","category":"Credits","question":"Which statement about refundable tax credits is generally true?","choices":["They may create a refund even if they reduce tax below zero","They can never help if you owe no tax","They are the same as business expenses","They only apply to property taxes"],"answer":0},{"id":60,"difficulty":"advanced","category":"Credits","question":"Which statement about nonrefundable tax credits is generally true?","choices":["They can reduce tax owed, but usually not below zero","They always produce a cash refund","They increase taxable income","They are only for corporations"],"answer":0},{"id":61,"difficulty":"intermediate","category":"Filing","question":"What should you do if you cannot pay your full tax bill by the deadline?","choices":["File on time if required and contact the tax agency about payment options","Ignore all letters","Throw away the return","Wait ten years to file"],"answer":0},{"id":62,"difficulty":"intermediate","category":"Filing","question":"Why might direct deposit be useful for a tax refund?","choices":["It can be faster and safer than waiting for a paper check","It increases the refund amount automatically","It lets you avoid filing a return","It changes your filing status"],"answer":0},{"id":63,"difficulty":"intermediate","category":"Filing","question":"What is e-filing?","choices":["Submitting a tax return electronically","Paying rent online","Emailing your bank password","Creating a credit card account"],"answer":0},{"id":64,"difficulty":"intermediate","category":"Dependents","question":"A dependent is generally what?","choices":["A qualifying person who may be claimed on someone else's tax return","Anyone who has a driver's license","Only a person over age 65","A type of retirement account"],"answer":0},{"id":65,"difficulty":"intermediate","category":"Dependents","question":"Can the same dependent usually be claimed by two different taxpayers for the same year?","choices":["No, not for the same tax benefit in the same year","Yes, everyone in the family can claim the person","Yes, but only if both file late","Yes, if the dependent has a savings account"],"answer":0},{"id":66,"difficulty":"basic","category":"Paychecks","question":"What does gross pay mean?","choices":["Pay before taxes and other deductions are taken out","Pay after all deductions","Only cash tips","Only retirement contributions"],"answer":0},{"id":67,"difficulty":"basic","category":"Paychecks","question":"What does net pay mean?","choices":["Take-home pay after taxes and deductions","Pay before any deductions","Only employer benefits","Only overtime wages"],"answer":0},{"id":68,"difficulty":"basic","category":"Paychecks","question":"What are payroll taxes commonly used to fund?","choices":["Social Security and Medicare","Only local grocery stores","Personal credit card rewards","Private student loans"],"answer":0},{"id":69,"difficulty":"basic","category":"Planning","question":"Why might a big life change affect your taxes?","choices":["Events like marriage, a child, a new job, or self-employment can change tax details","Life changes automatically cancel tax filing","Taxes only depend on your birthday","Tax rules never consider family or income changes"],"answer":0},{"id":70,"difficulty":"basic","category":"Planning","question":"Why review your paycheck withholding during the year?","choices":["To reduce surprises at tax time","To avoid receiving paychecks","To make all income non-taxable","To change your Social Security number"],"answer":0},{"id":71,"difficulty":"intermediate","category":"Retirement","question":"What can happen if you withdraw retirement money too early?","choices":["Taxes and penalties may apply depending on the account and situation","The withdrawal is always tax-free","The IRS opens a savings account for you","Your employer must match it twice"],"answer":0},{"id":72,"difficulty":"intermediate","category":"Retirement","question":"What is vesting in a workplace retirement plan?","choices":["The schedule for when employer contributions become fully yours","The interest rate on a checking account","A way to avoid reporting wages","The amount of sales tax on investments"],"answer":0},{"id":73,"difficulty":"intermediate","category":"Education","question":"Which account is often used to save for education costs with tax advantages?","choices":["529 plan","W-2 plan","Schedule C account","Withholding account"],"answer":0},{"id":74,"difficulty":"intermediate","category":"Education","question":"Student loan interest may be what for some taxpayers?","choices":["Potentially deductible within limits","Always refunded in full","Never reported anywhere","A payroll tax"],"answer":0},{"id":75,"difficulty":"intermediate","category":"Homeownership","question":"Which cost may be deductible for some homeowners who itemize?","choices":["Mortgage interest within limits","Every home repair automatically","Furniture for personal use","Streaming subscriptions"],"answer":0},{"id":76,"difficulty":"intermediate","category":"Homeownership","question":"Property taxes may be deductible for some taxpayers who do what?","choices":["Itemize deductions, subject to limits","Take only the standard deduction","Never file a return","Pay with a debit card only"],"answer":0},{"id":77,"difficulty":"advanced","category":"Self-Employment","question":"What is Schedule C commonly used for?","choices":["Reporting profit or loss from a sole proprietorship","Reporting employee withholding only","Claiming dependents only","Opening a retirement account"],"answer":0},{"id":78,"difficulty":"advanced","category":"Self-Employment","question":"Which habit helps self-employed people at tax time?","choices":["Separating business and personal records","Mixing all receipts in one pile with no notes","Ignoring income until April","Deleting invoices after payment"],"answer":0},{"id":79,"difficulty":"advanced","category":"Self-Employment","question":"What does 'ordinary and necessary' mean for many business deductions?","choices":["Common and helpful for that type of business","Fancy and expensive","Personal and unrelated","Paid only in cash"],"answer":0},{"id":80,"difficulty":"intermediate","category":"Tax Forms","question":"What is Form W-9 often used for?","choices":["Giving a taxpayer identification number to someone who may pay you","Filing an annual individual tax return","Reporting employee wages to an employee","Claiming mortgage interest"],"answer":0},{"id":81,"difficulty":"intermediate","category":"Tax Forms","question":"What does Form 1040 refer to?","choices":["The main U.S. individual income tax return form","A credit card application","A bank deposit slip","A workplace time sheet"],"answer":0},{"id":82,"difficulty":"basic","category":"Common Mistakes","question":"Which mistake can delay a tax refund?","choices":["Entering incorrect bank or identification information","Keeping organized records","Signing the return","Reporting all income"],"answer":0},{"id":83,"difficulty":"basic","category":"Common Mistakes","question":"Why should you report all taxable income forms you receive?","choices":["Tax agencies may receive matching copies too","Forms are only decorative","Reporting income always removes refunds","Only W-2 forms ever matter"],"answer":0},{"id":84,"difficulty":"basic","category":"Security","question":"Which is a sign of a tax scam?","choices":["A demand for immediate payment by gift card","A normal tax form from an employer","A secure online tax account","A copy of your own filed return"],"answer":0},{"id":85,"difficulty":"basic","category":"Security","question":"Why protect your Social Security number?","choices":["It can be used for identity theft and fraudulent filings","It changes your tax bracket every week","It is the same as a coupon code","It is only used for grocery rewards"],"answer":0},{"id":86,"difficulty":"basic","category":"Savings","question":"What is a sinking fund?","choices":["Savings set aside for a planned future expense","A loan that grows forever","A tax penalty account","A credit score category"],"answer":0},{"id":87,"difficulty":"basic","category":"Savings","question":"Why automate savings?","choices":["It makes saving consistent before the money is spent elsewhere","It guarantees investment returns","It replaces all insurance","It removes the need to pay bills"],"answer":0},{"id":88,"difficulty":"basic","category":"Credit","question":"Checking your own credit report is usually what kind of inquiry?","choices":["A soft inquiry that does not hurt your score","A hard inquiry that always lowers it by 100 points","A tax audit","A loan payment"],"answer":0},{"id":89,"difficulty":"basic","category":"Credit","question":"What is a secured credit card?","choices":["A card backed by a cash deposit, often used to build credit","A card that can never charge interest","A card only for property taxes","A debit card with no bank account"],"answer":0},{"id":90,"difficulty":"basic","category":"Loans","question":"What is principal on a loan?","choices":["The amount borrowed before interest","The fee for filing taxes","The interest rate only","The lender's profit after taxes"],"answer":0},{"id":91,"difficulty":"basic","category":"Loans","question":"What is amortization?","choices":["Paying down a loan over time with scheduled payments","Avoiding all loan payments","A type of payroll tax","A credit card reward program"],"answer":0},{"id":92,"difficulty":"basic","category":"Inflation","question":"What is inflation?","choices":["A general rise in prices over time","A guaranteed raise at work","A tax form for contractors","A type of bank account"],"answer":0},{"id":93,"difficulty":"basic","category":"Inflation","question":"How can inflation affect cash savings?","choices":["It can reduce purchasing power over time","It always doubles savings","It makes every bill disappear","It changes your filing status"],"answer":0},{"id":94,"difficulty":"basic","category":"Consumer Skills","question":"What is comparison shopping?","choices":["Checking options and prices before buying","Buying the first item you see every time","Ignoring total cost","Filing a tax extension"],"answer":0},{"id":95,"difficulty":"basic","category":"Consumer Skills","question":"Why read the fine print on a financial product?","choices":["It may explain fees, rates, deadlines, and limits","It always contains jokes only","It is never legally important","It replaces customer service"],"answer":0},{"id":96,"difficulty":"basic","category":"Goals","question":"What does it mean for a financial goal to be measurable?","choices":["You can track a specific amount or milestone","It is impossible to write down","It changes every hour","It has no deadline or amount"],"answer":0},{"id":97,"difficulty":"basic","category":"Goals","question":"Which goal is more specific?","choices":["Save $500 for car repairs by December","Save some money someday","Be better with money maybe","Spend less somehow"],"answer":0},{"id":98,"difficulty":"intermediate","category":"Taxes and Life","question":"Why tell a tax preparer about a side gig?","choices":["Side income and related expenses may affect the return","Side gigs are never taxable","It prevents all audits automatically","It changes your birth date"],"answer":0},{"id":99,"difficulty":"intermediate","category":"Taxes and Life","question":"Why can moving affect your tax situation?","choices":["Different states and localities may have different tax rules","Moving makes federal tax disappear","Only your ZIP code is taxable","Moving always creates a refund"],"answer":0},{"id":100,"difficulty":"intermediate","category":"Taxes and Life","question":"What is a good first step when a tax notice arrives?","choices":["Read it carefully and respond by the deadline if needed","Ignore it forever","Post your Social Security number online","Assume it is always fake without checking"],"answer":0},{"id":101,"difficulty":"basic","category":"Budgeting","question":"What is the main purpose of making a personal budget?","choices":["To plan how income will cover spending, saving, and debt payments","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":102,"difficulty":"basic","category":"Budgeting","question":"What is a fixed expense?","choices":["A bill that is usually the same amount each month","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":103,"difficulty":"basic","category":"Budgeting","question":"What is a variable expense?","choices":["A cost that can change from month to month","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":104,"difficulty":"basic","category":"Budgeting","question":"Why is tracking spending useful?","choices":["It shows where money is actually going","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":105,"difficulty":"basic","category":"Budgeting","question":"What does it mean to pay yourself first?","choices":["Set aside savings before spending the rest","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":106,"difficulty":"basic","category":"Budgeting","question":"What is a want in a basic budget?","choices":["Something nice to have but not required for basic living","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":107,"difficulty":"basic","category":"Budgeting","question":"What is a need in a basic budget?","choices":["Something required for basic living or work","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":108,"difficulty":"basic","category":"Budgeting","question":"How does a sinking fund help with planned expenses?","choices":["It builds savings gradually for a known future cost","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":109,"difficulty":"basic","category":"Budgeting","question":"Why review subscriptions regularly?","choices":["Small recurring charges can quietly reduce cash flow","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":110,"difficulty":"basic","category":"Budgeting","question":"What is cash flow?","choices":["Money coming in and going out over a period of time","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":111,"difficulty":"basic","category":"Savings","question":"What is an emergency fund for?","choices":["Unexpected expenses or income interruptions","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":112,"difficulty":"basic","category":"Savings","question":"Where should emergency fund money usually be kept?","choices":["Somewhere safe and easy to access","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":113,"difficulty":"basic","category":"Savings","question":"Why start with a small starter emergency fund?","choices":["It gives a quick cushion while larger savings grow","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":114,"difficulty":"basic","category":"Savings","question":"What does automatic saving help with?","choices":["Making saving consistent without relying on memory","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":115,"difficulty":"basic","category":"Savings","question":"What is a savings goal?","choices":["A specific reason and amount you are saving for","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":116,"difficulty":"basic","category":"Savings","question":"Why separate savings for different goals?","choices":["It makes progress easier to see and protect","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":117,"difficulty":"basic","category":"Savings","question":"What is interest on a savings account?","choices":["Money the bank pays for holding your deposit","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":118,"difficulty":"basic","category":"Savings","question":"How does compound interest grow savings?","choices":["It earns interest on original money and past interest","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":119,"difficulty":"basic","category":"Savings","question":"Why does time matter for compound growth?","choices":["More time gives growth more chances to build","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":120,"difficulty":"basic","category":"Savings","question":"What is liquidity?","choices":["How quickly money can be accessed without a big penalty","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":121,"difficulty":"basic","category":"Banking","question":"What is a checking account mainly used for?","choices":["Everyday deposits, payments, and withdrawals","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":122,"difficulty":"basic","category":"Banking","question":"What is a savings account mainly used for?","choices":["Keeping money for goals or emergencies","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":123,"difficulty":"basic","category":"Banking","question":"What is a debit card connected to?","choices":["Money in a bank account","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":124,"difficulty":"basic","category":"Banking","question":"What does overdraft mean?","choices":["Spending more than the available account balance","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":125,"difficulty":"basic","category":"Banking","question":"Why reconcile a bank account?","choices":["To compare your records with the bank's records","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":126,"difficulty":"basic","category":"Banking","question":"Why does FDIC insurance matter to bank customers?","choices":["It protects deposits at covered banks up to legal limits","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":127,"difficulty":"basic","category":"Banking","question":"What does a routing number identify?","choices":["The financial institution connected to an account","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":128,"difficulty":"basic","category":"Banking","question":"What is direct deposit?","choices":["Electronic payment sent straight into a bank account","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":129,"difficulty":"basic","category":"Banking","question":"Why keep bank login information private?","choices":["To reduce the risk of account theft","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":130,"difficulty":"basic","category":"Banking","question":"What is a monthly bank statement?","choices":["A summary of account activity for a period","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":131,"difficulty":"basic","category":"Credit","question":"What is credit?","choices":["The ability to borrow now and repay later","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":132,"difficulty":"basic","category":"Credit","question":"What is a credit score used for?","choices":["Estimating how risky it may be to lend to someone","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":133,"difficulty":"basic","category":"Credit","question":"Which habit usually helps credit?","choices":["Paying bills on time","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":134,"difficulty":"basic","category":"Credit","question":"How is credit utilization calculated?","choices":["It compares credit balances with available credit limits","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":135,"difficulty":"basic","category":"Credit","question":"What is a credit limit?","choices":["The maximum amount a lender allows you to borrow on an account","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":136,"difficulty":"basic","category":"Credit","question":"What is a minimum payment?","choices":["The smallest required payment due for a billing cycle","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":137,"difficulty":"basic","category":"Credit","question":"What does APR describe?","choices":["The yearly cost of borrowing expressed as a percentage","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":138,"difficulty":"basic","category":"Credit","question":"What is a credit report?","choices":["A record of credit accounts, payment history, and related activity","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":139,"difficulty":"basic","category":"Credit","question":"Why check your credit report?","choices":["To spot errors or signs of identity theft","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":140,"difficulty":"basic","category":"Credit","question":"How does a secured credit card usually reduce lender risk?","choices":["It is backed by a cash deposit from the cardholder","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":141,"difficulty":"basic","category":"Debt","question":"When repaying a loan, what does principal refer to?","choices":["The amount borrowed before interest","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":142,"difficulty":"basic","category":"Debt","question":"What is interest on debt?","choices":["The cost charged for borrowing money","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":143,"difficulty":"basic","category":"Debt","question":"Why can high-interest debt be expensive?","choices":["Interest can grow quickly if balances remain unpaid","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":144,"difficulty":"basic","category":"Debt","question":"What is the debt snowball method?","choices":["Paying extra toward the smallest balance first","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":145,"difficulty":"basic","category":"Debt","question":"What is the debt avalanche method?","choices":["Paying extra toward the highest interest rate first","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":146,"difficulty":"basic","category":"Debt","question":"Why compare total loan cost?","choices":["A lower payment can still cost more over time","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":147,"difficulty":"basic","category":"Debt","question":"What is a late fee?","choices":["A charge for missing a payment deadline","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":148,"difficulty":"basic","category":"Debt","question":"What is refinancing?","choices":["Replacing an existing loan with a new one","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":149,"difficulty":"basic","category":"Debt","question":"Why avoid borrowing for impulse purchases?","choices":["The debt may outlast the value of the purchase","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":150,"difficulty":"basic","category":"Debt","question":"What does co-signing a loan mean?","choices":["Agreeing to be responsible if the borrower does not pay","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":151,"difficulty":"basic","category":"Investing","question":"What is investing?","choices":["Putting money into assets with the goal of future growth","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":152,"difficulty":"basic","category":"Investing","question":"What is risk in investing?","choices":["The chance that returns may be lower than expected or negative","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":153,"difficulty":"basic","category":"Investing","question":"How does diversification reduce some investment risk?","choices":["It spreads money across different investments","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":154,"difficulty":"basic","category":"Investing","question":"What is a stock?","choices":["A share of ownership in a company","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":155,"difficulty":"basic","category":"Investing","question":"What is a bond?","choices":["A loan investors make to a company or government","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":156,"difficulty":"basic","category":"Investing","question":"What is an index fund?","choices":["A fund designed to track a market index","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":157,"difficulty":"basic","category":"Investing","question":"Why do fees matter when investing?","choices":["Fees reduce the return an investor keeps","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":158,"difficulty":"basic","category":"Investing","question":"What is a time horizon?","choices":["How long money can stay invested before it is needed","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":159,"difficulty":"basic","category":"Investing","question":"Why is investing usually better for long-term goals?","choices":["Longer time can help ride out market ups and downs","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":160,"difficulty":"basic","category":"Investing","question":"What does market volatility mean?","choices":["Investment prices move up and down","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":161,"difficulty":"basic","category":"Insurance","question":"What is insurance?","choices":["A way to share financial risk with an insurer","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":162,"difficulty":"basic","category":"Insurance","question":"What is a premium?","choices":["The amount paid to keep insurance coverage active","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":163,"difficulty":"basic","category":"Insurance","question":"When does an insurance deductible usually matter?","choices":["It is the amount you pay before certain coverage starts","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":164,"difficulty":"basic","category":"Insurance","question":"Why have auto liability insurance?","choices":["To help cover damage or injuries you cause to others","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":165,"difficulty":"basic","category":"Insurance","question":"What does renters insurance often protect?","choices":["Personal belongings and certain liability risks","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":166,"difficulty":"basic","category":"Insurance","question":"What is health insurance used for?","choices":["Helping pay covered medical costs","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":167,"difficulty":"basic","category":"Insurance","question":"Why review insurance coverage after life changes?","choices":["Needs can change after moving, marriage, children, or new assets","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":168,"difficulty":"basic","category":"Insurance","question":"What is a beneficiary?","choices":["A person or entity named to receive money from an account or policy","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":169,"difficulty":"basic","category":"Insurance","question":"What is disability insurance meant to protect?","choices":["Income if illness or injury prevents work","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":170,"difficulty":"basic","category":"Insurance","question":"What is term life insurance?","choices":["Life insurance coverage for a set period","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":171,"difficulty":"basic","category":"Income","question":"What is gross income?","choices":["Income before taxes and deductions","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":172,"difficulty":"basic","category":"Income","question":"What is net income?","choices":["Income left after taxes and deductions","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":173,"difficulty":"basic","category":"Income","question":"What is a paycheck stub?","choices":["A record showing pay, taxes, and deductions for a pay period","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":174,"difficulty":"basic","category":"Income","question":"What is overtime pay?","choices":["Extra pay for qualifying hours worked beyond regular limits","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":175,"difficulty":"basic","category":"Income","question":"What is a side gig?","choices":["Work done outside a main job to earn extra income","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":176,"difficulty":"basic","category":"Income","question":"Why keep track of cash income?","choices":["Taxable income generally must be reported even if paid in cash","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":177,"difficulty":"basic","category":"Income","question":"What is a raise?","choices":["An increase in pay","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":178,"difficulty":"basic","category":"Income","question":"What is salary?","choices":["A set amount of pay for work over a period","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":179,"difficulty":"basic","category":"Income","question":"What is hourly pay?","choices":["Pay based on the number of hours worked","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":180,"difficulty":"basic","category":"Income","question":"What is a benefit from an employer?","choices":["Compensation such as insurance, retirement contributions, or paid time off","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":181,"difficulty":"basic","category":"Consumer Skills","question":"Why compare prices before buying?","choices":["It can help avoid overpaying","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":182,"difficulty":"basic","category":"Consumer Skills","question":"Why read the fine print?","choices":["It may explain fees, limits, and important conditions","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":183,"difficulty":"basic","category":"Consumer Skills","question":"What is an impulse purchase?","choices":["A purchase made quickly without much planning","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":184,"difficulty":"basic","category":"Consumer Skills","question":"What is opportunity cost?","choices":["What you give up when choosing one option over another","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":185,"difficulty":"basic","category":"Consumer Skills","question":"Why keep receipts for major purchases?","choices":["They can help with returns, warranties, and records","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":186,"difficulty":"basic","category":"Consumer Skills","question":"What is a warranty?","choices":["A promise about repair, replacement, or service for a product","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":187,"difficulty":"basic","category":"Consumer Skills","question":"Why be careful with buy now, pay later offers?","choices":["Payments can stack up and strain a budget","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":188,"difficulty":"basic","category":"Consumer Skills","question":"What is a unit price?","choices":["The cost per standard amount, such as per ounce or per item","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":189,"difficulty":"basic","category":"Consumer Skills","question":"Why avoid sharing financial information over public Wi-Fi?","choices":["It can increase the risk of theft or fraud","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":190,"difficulty":"basic","category":"Consumer Skills","question":"What is phishing?","choices":["A fake message designed to steal personal or financial information","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":191,"difficulty":"basic","category":"Goals","question":"What does a specific money goal include?","choices":["A clear target, such as an amount and purpose","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":192,"difficulty":"basic","category":"Goals","question":"What makes a financial goal measurable?","choices":["Progress can be tracked with numbers","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":193,"difficulty":"basic","category":"Goals","question":"Why set a deadline for a goal?","choices":["It helps shape how much to save regularly","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":194,"difficulty":"basic","category":"Goals","question":"What is a short-term goal?","choices":["A goal you expect to reach relatively soon","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":195,"difficulty":"basic","category":"Goals","question":"What is a long-term goal?","choices":["A goal that may take years to reach","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":196,"difficulty":"basic","category":"Goals","question":"Why write down financial goals?","choices":["It makes the goal easier to remember and review","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":197,"difficulty":"basic","category":"Goals","question":"What is a tradeoff in money decisions?","choices":["Choosing one thing means giving up another","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":198,"difficulty":"basic","category":"Goals","question":"Why review goals after a life change?","choices":["Income, expenses, and priorities may shift","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":199,"difficulty":"basic","category":"Goals","question":"What is a realistic savings goal?","choices":["A goal that fits your income, expenses, and timeframe","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":200,"difficulty":"basic","category":"Goals","question":"Why celebrate small money milestones?","choices":["It can help maintain motivation","It is a way to avoid keeping any records","It means every purchase is tax deductible","It guarantees a profit with no risk"],"answer":0},{"id":201,"difficulty":"intermediate","category":"Budgeting","question":"If your income changes each month, what is a practical way to budget?","choices":["Base essentials on a conservative income estimate and save extra in higher months","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":202,"difficulty":"intermediate","category":"Budgeting","question":"Why build annual expenses into a monthly budget?","choices":["It prevents irregular bills from becoming surprises","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":203,"difficulty":"intermediate","category":"Budgeting","question":"What does a zero-based budget try to do?","choices":["Assign every dollar of income to a job","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":204,"difficulty":"intermediate","category":"Budgeting","question":"How can the 50/30/20 guideline help?","choices":["It gives a simple starting point for needs, wants, and savings or debt","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":205,"difficulty":"intermediate","category":"Budgeting","question":"Why compare actual spending with planned spending?","choices":["It shows where the budget needs adjustment","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":206,"difficulty":"intermediate","category":"Budgeting","question":"What is a good response when groceries keep exceeding the budget?","choices":["Review actual purchases and adjust the plan or habits","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":207,"difficulty":"intermediate","category":"Budgeting","question":"Why budget before payday?","choices":["It helps decide where money should go before it is spent","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":208,"difficulty":"intermediate","category":"Budgeting","question":"How should a budget treat a temporary overtime bump?","choices":["Use it intentionally instead of assuming it will continue","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":209,"difficulty":"intermediate","category":"Budgeting","question":"Why separate bills by due date?","choices":["It helps match payments to paychecks","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":210,"difficulty":"intermediate","category":"Budgeting","question":"What should happen when a budget category is too low every month?","choices":["Revise the category or change the spending behavior","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":211,"difficulty":"intermediate","category":"Credit","question":"If a card has a high balance compared with its limit, what may happen?","choices":["Credit utilization may rise and pressure the credit score","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":212,"difficulty":"intermediate","category":"Credit","question":"What is the advantage of paying a credit card in full by the due date?","choices":["It can avoid interest on purchases when the grace period applies","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":213,"difficulty":"intermediate","category":"Credit","question":"What should you check before using a balance transfer offer?","choices":["Fees, promotional end date, and the regular APR","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":214,"difficulty":"intermediate","category":"Credit","question":"Why can closing an old credit card affect credit?","choices":["It may reduce available credit or shorten credit history","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":215,"difficulty":"intermediate","category":"Credit","question":"What is a hard inquiry?","choices":["A lender check tied to an application for credit","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":216,"difficulty":"intermediate","category":"Credit","question":"What should you do if you find a credit report error?","choices":["Dispute it with the credit bureau and provide support","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":217,"difficulty":"intermediate","category":"Credit","question":"Why is co-signing risky?","choices":["You can be responsible for the debt if the other person does not pay","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":218,"difficulty":"intermediate","category":"Credit","question":"What does debt-to-income ratio compare?","choices":["Monthly debt payments with income","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":219,"difficulty":"intermediate","category":"Credit","question":"Why avoid applying for many loans at once?","choices":["Multiple hard inquiries and new accounts can concern lenders","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":220,"difficulty":"intermediate","category":"Credit","question":"What is one reason to keep credit card balances low?","choices":["It leaves room for emergencies and can help credit utilization","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":221,"difficulty":"intermediate","category":"Debt","question":"Why does the avalanche method often save money?","choices":["It targets the debt with the highest interest rate first","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":222,"difficulty":"intermediate","category":"Debt","question":"Why might someone choose the snowball method?","choices":["Small wins can help motivation","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":223,"difficulty":"intermediate","category":"Debt","question":"What should you compare when choosing between two loans?","choices":["APR, fees, payment amount, and total repayment cost","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":224,"difficulty":"intermediate","category":"Debt","question":"Why can a longer loan term cost more?","choices":["Interest may be charged over more months","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":225,"difficulty":"intermediate","category":"Debt","question":"What is a prepayment penalty?","choices":["A fee for paying off a loan early","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":226,"difficulty":"intermediate","category":"Debt","question":"Why contact a lender before missing a payment?","choices":["There may be hardship options before the account becomes delinquent","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":227,"difficulty":"intermediate","category":"Debt","question":"What is consolidation?","choices":["Combining multiple debts into one new payment","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":228,"difficulty":"intermediate","category":"Debt","question":"When can consolidation be unhelpful?","choices":["When it lowers payments but increases total cost or encourages new debt","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":229,"difficulty":"intermediate","category":"Debt","question":"Why should payday loans be treated cautiously?","choices":["Fees can translate into very high borrowing costs","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":230,"difficulty":"intermediate","category":"Debt","question":"How does amortization reduce a loan balance?","choices":["Scheduled payments gradually pay down a loan over time","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":231,"difficulty":"intermediate","category":"Banking","question":"Why keep a cushion in a checking account?","choices":["It can help avoid overdrafts and timing mistakes","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":232,"difficulty":"intermediate","category":"Banking","question":"What is an ACH transfer?","choices":["An electronic bank-to-bank payment","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":233,"difficulty":"intermediate","category":"Banking","question":"Why use alerts on bank accounts?","choices":["They can flag low balances, deposits, or unusual activity","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":234,"difficulty":"intermediate","category":"Banking","question":"What should you check before opening a bank account?","choices":["Fees, minimum balances, access, and deposit insurance","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":235,"difficulty":"intermediate","category":"Banking","question":"How is a certificate of deposit different from regular savings?","choices":["It usually locks money for a set term in exchange for a stated rate","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":236,"difficulty":"intermediate","category":"Banking","question":"What can happen if you withdraw early from a CD?","choices":["You may pay an early withdrawal penalty","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":237,"difficulty":"intermediate","category":"Banking","question":"What is NCUA insurance generally connected to?","choices":["Deposits at covered credit unions","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":238,"difficulty":"intermediate","category":"Banking","question":"Why review bank statements monthly?","choices":["To catch errors, fees, and unauthorized transactions","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":239,"difficulty":"intermediate","category":"Banking","question":"What is a cashier's check?","choices":["A bank-issued check backed by the bank's funds","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":240,"difficulty":"intermediate","category":"Banking","question":"Why be careful with payment apps?","choices":["Transfers can be hard to reverse if sent to the wrong person","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":241,"difficulty":"intermediate","category":"Investing","question":"Why match investments to time horizon?","choices":["Money needed soon should usually take less risk","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":242,"difficulty":"intermediate","category":"Investing","question":"What does risk tolerance measure?","choices":["How much uncertainty or loss an investor can handle","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":243,"difficulty":"intermediate","category":"Investing","question":"Why can an expense ratio matter over decades?","choices":["Small annual fees can compound into large costs","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":244,"difficulty":"intermediate","category":"Investing","question":"What is dollar-cost averaging?","choices":["Investing a set amount on a regular schedule","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":245,"difficulty":"intermediate","category":"Investing","question":"Why avoid trying to time the market?","choices":["It is difficult to consistently predict short-term moves","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":246,"difficulty":"intermediate","category":"Investing","question":"What is an ETF?","choices":["A fund that trades on an exchange like a stock","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":247,"difficulty":"intermediate","category":"Investing","question":"Why rebalance a portfolio?","choices":["To bring investments back toward the intended mix","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":248,"difficulty":"intermediate","category":"Investing","question":"What role can bonds play in a portfolio?","choices":["They may add income and reduce some volatility","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":249,"difficulty":"intermediate","category":"Investing","question":"Why keep emergency savings separate from investments?","choices":["Investments can lose value when cash is needed","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":250,"difficulty":"intermediate","category":"Investing","question":"What is asset allocation?","choices":["How money is divided among investment types","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":251,"difficulty":"intermediate","category":"Retirement","question":"Why contribute enough to capture an employer match if possible?","choices":["The match adds employer money to retirement savings","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":252,"difficulty":"intermediate","category":"Retirement","question":"What is a rollover?","choices":["Moving retirement funds from one qualified account to another","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":253,"difficulty":"intermediate","category":"Retirement","question":"Why name beneficiaries on retirement accounts?","choices":["It helps direct where the account goes after death","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":254,"difficulty":"intermediate","category":"Retirement","question":"What is a target-date fund designed to do?","choices":["Adjust its investment mix as the target year approaches","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":255,"difficulty":"intermediate","category":"Retirement","question":"Why compare traditional and Roth contributions?","choices":["They are taxed at different times","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":256,"difficulty":"intermediate","category":"Retirement","question":"What can vesting affect?","choices":["How much of employer contributions you keep after leaving a job","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":257,"difficulty":"intermediate","category":"Retirement","question":"Why avoid early retirement withdrawals when possible?","choices":["Taxes, penalties, and lost growth may apply","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":258,"difficulty":"intermediate","category":"Retirement","question":"What is a catch-up contribution?","choices":["An extra allowed contribution for older eligible savers","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":259,"difficulty":"intermediate","category":"Retirement","question":"Why review old workplace retirement accounts?","choices":["Fees, investment choices, and consolidation options may matter","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":260,"difficulty":"intermediate","category":"Retirement","question":"What is one retirement planning risk?","choices":["Outliving savings because expenses last longer than expected","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":261,"difficulty":"intermediate","category":"Insurance","question":"How does choosing a higher deductible usually affect premiums?","choices":["Premiums may be lower, but out-of-pocket risk is higher","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":262,"difficulty":"intermediate","category":"Insurance","question":"Why compare an insurance policy's exclusions?","choices":["They explain what is not covered","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":263,"difficulty":"intermediate","category":"Insurance","question":"What is an out-of-pocket maximum in health insurance?","choices":["A cap on covered costs you pay in a plan year","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":264,"difficulty":"intermediate","category":"Insurance","question":"Why consider disability insurance if you rely on your paycheck?","choices":["It can replace part of income if you cannot work","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":265,"difficulty":"intermediate","category":"Insurance","question":"What is liability coverage?","choices":["Protection against certain claims that you caused harm or damage","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":266,"difficulty":"intermediate","category":"Insurance","question":"Why keep an inventory of belongings?","choices":["It can support an insurance claim","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":267,"difficulty":"intermediate","category":"Insurance","question":"What is umbrella insurance?","choices":["Extra liability coverage above certain other policies","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":268,"difficulty":"intermediate","category":"Insurance","question":"Why update life insurance after having a child?","choices":["Dependents can change the amount of protection needed","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":269,"difficulty":"intermediate","category":"Insurance","question":"What should you compare besides premium price?","choices":["Deductibles, limits, exclusions, and service","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":270,"difficulty":"intermediate","category":"Insurance","question":"Why might renters insurance matter even without owning a home?","choices":["A landlord's policy usually does not cover a renter's belongings","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":271,"difficulty":"intermediate","category":"Taxes","question":"Why review withholding after a new job or raise?","choices":["Income changes can change the amount of tax that should be withheld","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":272,"difficulty":"intermediate","category":"Taxes","question":"What is the difference between a credit and a deduction?","choices":["A credit reduces tax directly, while a deduction reduces taxable income","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":273,"difficulty":"intermediate","category":"Taxes","question":"Why keep records for deductible expenses?","choices":["Records support the claim if questions come up","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":274,"difficulty":"intermediate","category":"Taxes","question":"What should a freelancer plan for that employees often have withheld?","choices":["Income tax and self-employment tax","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":275,"difficulty":"intermediate","category":"Taxes","question":"Why might a tax refund be smaller after changing withholding?","choices":["Less tax may have been paid in during the year","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":276,"difficulty":"intermediate","category":"Taxes","question":"What is the purpose of estimated tax payments?","choices":["To pay tax during the year when withholding is not enough","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":277,"difficulty":"intermediate","category":"Taxes","question":"What does a filing extension usually extend?","choices":["Time to file the return, not usually time to pay","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":278,"difficulty":"intermediate","category":"Taxes","question":"Why report income shown on 1099 forms?","choices":["Tax agencies may receive matching copies","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":279,"difficulty":"intermediate","category":"Taxes","question":"What is basis in an investment?","choices":["The amount used to measure gain or loss, often starting with cost","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":280,"difficulty":"intermediate","category":"Taxes","question":"Why can state taxes matter after moving?","choices":["Different states may tax income differently","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":281,"difficulty":"intermediate","category":"Self-Employment","question":"Why keep business and personal accounts separate?","choices":["It makes income and expense tracking cleaner","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":282,"difficulty":"intermediate","category":"Self-Employment","question":"Why save a portion of each client payment?","choices":["It helps prepare for taxes and slower months","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":283,"difficulty":"intermediate","category":"Self-Employment","question":"What should a mileage log include?","choices":["Date, business purpose, and miles driven","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":284,"difficulty":"intermediate","category":"Self-Employment","question":"Why send invoices promptly?","choices":["It improves cash flow and creates records","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":285,"difficulty":"intermediate","category":"Self-Employment","question":"What is net profit?","choices":["Business income left after business expenses","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":286,"difficulty":"intermediate","category":"Self-Employment","question":"Why track home office use carefully?","choices":["The deduction has specific use requirements","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":287,"difficulty":"intermediate","category":"Self-Employment","question":"What does ordinary and necessary mean?","choices":["Common and helpful for that type of business","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":288,"difficulty":"intermediate","category":"Self-Employment","question":"Why set aside money for quarterly payments?","choices":["Self-employed income may not have withholding","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":289,"difficulty":"intermediate","category":"Self-Employment","question":"What is a contractor agreement useful for?","choices":["Clarifying work, payment terms, and responsibilities","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":290,"difficulty":"intermediate","category":"Self-Employment","question":"Why keep receipts for business purchases?","choices":["They support expenses and help track profit","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":291,"difficulty":"intermediate","category":"Planning","question":"Why calculate net worth periodically?","choices":["It shows assets minus debts at a point in time","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":292,"difficulty":"intermediate","category":"Planning","question":"What is an emergency binder?","choices":["A place for key financial and legal information","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":293,"difficulty":"intermediate","category":"Planning","question":"Why review beneficiaries regularly?","choices":["Account directions should match current wishes","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":294,"difficulty":"intermediate","category":"Planning","question":"What is inflation's effect on purchasing power?","choices":["The same dollars may buy less over time","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":295,"difficulty":"intermediate","category":"Planning","question":"Why create a debt payoff plan before investing extra cash?","choices":["High-interest debt can undermine progress","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":296,"difficulty":"intermediate","category":"Planning","question":"What is a financial checkup?","choices":["A periodic review of goals, accounts, debts, and coverage","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":297,"difficulty":"intermediate","category":"Planning","question":"Why automate bill payments carefully?","choices":["It can prevent late payments if balances are monitored","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":298,"difficulty":"intermediate","category":"Planning","question":"Why keep short-term savings out of volatile investments?","choices":["The money may be needed before markets recover","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":299,"difficulty":"intermediate","category":"Planning","question":"What is estate planning generally about?","choices":["Preparing how assets and decisions are handled if you die or cannot act","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":300,"difficulty":"intermediate","category":"Planning","question":"Why review a financial plan after marriage or divorce?","choices":["Income, responsibilities, beneficiaries, and taxes may change","Ignore the timing and wait until tax season to decide","Use the highest possible income estimate every month","Choose the option with the largest advertised reward only"],"answer":0},{"id":301,"difficulty":"advanced","category":"Advanced Tax","question":"Why can marginal tax brackets be misunderstood?","choices":["Only income within each bracket is taxed at that bracket's rate","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":302,"difficulty":"advanced","category":"Advanced Tax","question":"What can determine whether an investment gain is short-term or long-term?","choices":["How long the asset was held before sale","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":303,"difficulty":"advanced","category":"Advanced Tax","question":"Why does cost basis matter when selling investments?","choices":["It helps calculate taxable gain or loss","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":304,"difficulty":"advanced","category":"Advanced Tax","question":"What is tax-loss harvesting intended to do?","choices":["Use realized losses to offset certain gains or income within rules","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":305,"difficulty":"advanced","category":"Advanced Tax","question":"Why can wash sale rules matter?","choices":["They can delay a loss if a substantially identical security is repurchased too soon","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":306,"difficulty":"advanced","category":"Advanced Tax","question":"Why compare itemizing with the standard deduction?","choices":["The larger allowable deduction usually gives the better tax result","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":307,"difficulty":"advanced","category":"Advanced Tax","question":"What is the purpose of depreciation for business property?","choices":["To deduct the cost of certain assets over time","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":308,"difficulty":"advanced","category":"Advanced Tax","question":"Why can state residency be complex?","choices":["More than one state may look at where you live, work, or maintain ties","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":309,"difficulty":"advanced","category":"Advanced Tax","question":"What is the alternative minimum tax designed to do?","choices":["Limit some tax benefits for certain higher-income taxpayers","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":310,"difficulty":"advanced","category":"Advanced Tax","question":"Why should estimated tax safe harbor rules be checked?","choices":["They may help avoid underpayment penalties when income varies","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":311,"difficulty":"advanced","category":"Self-Employment","question":"Why can worker classification matter?","choices":["Employee and contractor status affect taxes, benefits, and responsibilities","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":312,"difficulty":"advanced","category":"Self-Employment","question":"What is reasonable compensation relevant to in an S corporation?","choices":["Owner-employees generally must be paid reasonable wages for services","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":313,"difficulty":"advanced","category":"Self-Employment","question":"Why separate accountable plan reimbursements from draws?","choices":["They can affect how business expenses and owner payments are documented","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":314,"difficulty":"advanced","category":"Self-Employment","question":"What is a qualified business income deduction generally tied to?","choices":["Eligible pass-through business income and specific limits","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":315,"difficulty":"advanced","category":"Self-Employment","question":"Why track mixed-use assets carefully?","choices":["Only the business-use portion may be deductible","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":316,"difficulty":"advanced","category":"Self-Employment","question":"What is basis in a business ownership interest used for?","choices":["Determining allowed losses, distributions, and gain or loss","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":317,"difficulty":"advanced","category":"Self-Employment","question":"Why can inventory accounting matter for a small seller?","choices":["Cost of goods sold affects business profit","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":318,"difficulty":"advanced","category":"Self-Employment","question":"What can trigger sales tax collection duties?","choices":["Selling taxable goods or services in places where nexus rules apply","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":319,"difficulty":"advanced","category":"Self-Employment","question":"Why document contractor payments?","choices":["The business may need records for deductions and information reporting","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":320,"difficulty":"advanced","category":"Self-Employment","question":"Why can business entity choice affect taxes?","choices":["Different entities can change payroll, liability, and tax treatment","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":321,"difficulty":"advanced","category":"Retirement","question":"Why consider tax diversification in retirement savings?","choices":["Having pre-tax, Roth, and taxable funds can give withdrawal flexibility","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":322,"difficulty":"advanced","category":"Retirement","question":"What is a Roth conversion?","choices":["Moving pre-tax retirement money into a Roth account and recognizing taxable income","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":323,"difficulty":"advanced","category":"Retirement","question":"Why time a Roth conversion carefully?","choices":["It can increase taxable income in the conversion year","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":324,"difficulty":"advanced","category":"Retirement","question":"What are required minimum distributions?","choices":["Mandatory withdrawals from certain retirement accounts after a specified age","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":325,"difficulty":"advanced","category":"Retirement","question":"Why can sequence-of-returns risk matter?","choices":["Poor returns early in retirement can hurt withdrawals more","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":326,"difficulty":"advanced","category":"Retirement","question":"What is asset location?","choices":["Choosing which types of investments to hold in taxable, tax-deferred, or Roth accounts","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":327,"difficulty":"advanced","category":"Retirement","question":"Why coordinate Social Security timing with retirement savings?","choices":["Claiming age affects benefits and withdrawal needs","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":328,"difficulty":"advanced","category":"Retirement","question":"What is a backdoor Roth strategy generally used for?","choices":["Making Roth IRA funding possible when direct contributions are limited","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":329,"difficulty":"advanced","category":"Retirement","question":"Why can inherited retirement accounts require planning?","choices":["Distribution rules and taxes may depend on beneficiary type","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":330,"difficulty":"advanced","category":"Retirement","question":"What is longevity risk?","choices":["The risk of outliving available retirement resources","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":331,"difficulty":"advanced","category":"Investing","question":"What does correlation measure in a portfolio?","choices":["How investments tend to move relative to each other","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":332,"difficulty":"advanced","category":"Investing","question":"Why can concentration risk be dangerous?","choices":["Too much exposure to one company or sector can magnify losses","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":333,"difficulty":"advanced","category":"Investing","question":"What is real return?","choices":["Return after accounting for inflation","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":334,"difficulty":"advanced","category":"Investing","question":"Why compare nominal return with real return?","choices":["Inflation can reduce purchasing power even when balances rise","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":335,"difficulty":"advanced","category":"Investing","question":"What is duration in bond investing?","choices":["A measure of sensitivity to interest rate changes","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":336,"difficulty":"advanced","category":"Investing","question":"Why can rising interest rates hurt existing bond prices?","choices":["Newer bonds may offer higher yields, making older bonds less attractive","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":337,"difficulty":"advanced","category":"Investing","question":"What is rebalancing discipline meant to prevent?","choices":["Letting market moves create a riskier or different portfolio than intended","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":338,"difficulty":"advanced","category":"Investing","question":"Why avoid chasing recent performance?","choices":["Recent winners may not keep outperforming","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":339,"difficulty":"advanced","category":"Investing","question":"What is a taxable brokerage account?","choices":["An investment account without the same tax shelter as retirement accounts","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":340,"difficulty":"advanced","category":"Investing","question":"Why can dividends still matter at tax time?","choices":["They may be taxable even if reinvested","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":341,"difficulty":"advanced","category":"Debt","question":"Why compare effective borrowing cost instead of payment only?","choices":["Fees, rate, and term determine total cost","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":342,"difficulty":"advanced","category":"Debt","question":"What is negative amortization?","choices":["A loan balance grows because payments do not cover interest","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":343,"difficulty":"advanced","category":"Debt","question":"Why can adjustable-rate debt be risky?","choices":["Payments can rise when rates reset","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":344,"difficulty":"advanced","category":"Debt","question":"What does loan-to-value compare?","choices":["Loan balance with the value of the asset securing it","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":345,"difficulty":"advanced","category":"Debt","question":"Why can refinancing restart amortization?","choices":["A new term may push more interest into early payments","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":346,"difficulty":"advanced","category":"Debt","question":"What is a debt covenant?","choices":["A rule or requirement attached to some borrowing agreements","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":347,"difficulty":"advanced","category":"Debt","question":"Why can student loan repayment plan choice matter?","choices":["It affects payment size, interest, forgiveness eligibility, and total cost","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":348,"difficulty":"advanced","category":"Debt","question":"What is capitalization of interest?","choices":["Unpaid interest is added to principal","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":349,"difficulty":"advanced","category":"Debt","question":"Why should debt settlement be reviewed carefully?","choices":["It can involve fees, credit damage, taxes, or scams","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":350,"difficulty":"advanced","category":"Debt","question":"What is default?","choices":["Failure to meet the terms of a debt agreement","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":351,"difficulty":"advanced","category":"Insurance","question":"Why can underinsuring property be costly?","choices":["Coverage may not be enough to rebuild or replace after a loss","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":352,"difficulty":"advanced","category":"Insurance","question":"What is coinsurance in some property policies?","choices":["A requirement to insure property to a certain percentage of value","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":353,"difficulty":"advanced","category":"Insurance","question":"Why review replacement cost versus actual cash value?","choices":["They can pay very different amounts after a claim","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":354,"difficulty":"advanced","category":"Insurance","question":"What is an elimination period in disability insurance?","choices":["The waiting period before benefits begin","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":355,"difficulty":"advanced","category":"Insurance","question":"Why coordinate HSA eligibility with health plan choice?","choices":["Only qualifying high-deductible health plans allow HSA contributions","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":356,"difficulty":"advanced","category":"Insurance","question":"What is long-term care insurance intended to cover?","choices":["Certain extended care needs not usually covered by regular health insurance","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":357,"difficulty":"advanced","category":"Insurance","question":"Why can umbrella coverage require underlying limits?","choices":["The insurer may require minimum auto or home liability coverage first","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":358,"difficulty":"advanced","category":"Insurance","question":"What is adverse selection?","choices":["Higher-risk people are more likely to seek coverage","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":359,"difficulty":"advanced","category":"Insurance","question":"Why update coverage after buying expensive equipment?","choices":["Policy limits or endorsements may need adjustment","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":360,"difficulty":"advanced","category":"Insurance","question":"What is subrogation?","choices":["An insurer seeks recovery from another responsible party after paying a claim","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":361,"difficulty":"advanced","category":"Estate Planning","question":"Why does a will not control every asset?","choices":["Some assets pass by beneficiary designation or account title","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":362,"difficulty":"advanced","category":"Estate Planning","question":"What is probate?","choices":["A court process for administering certain assets after death","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":363,"difficulty":"advanced","category":"Estate Planning","question":"Why review account titling?","choices":["Ownership form can affect transfer, taxes, and control","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":364,"difficulty":"advanced","category":"Estate Planning","question":"What is a durable power of attorney?","choices":["A document naming someone to handle certain matters if you cannot","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":365,"difficulty":"advanced","category":"Estate Planning","question":"What is an advance health care directive?","choices":["Instructions or authority for medical decisions if you cannot speak for yourself","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":366,"difficulty":"advanced","category":"Estate Planning","question":"Why coordinate beneficiaries with the overall estate plan?","choices":["Beneficiary forms can override other wishes for those accounts","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":367,"difficulty":"advanced","category":"Estate Planning","question":"What is a trust often used for?","choices":["Managing how assets are controlled or distributed","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":368,"difficulty":"advanced","category":"Estate Planning","question":"Why can estate taxes vary by location?","choices":["Federal and state rules may differ","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":369,"difficulty":"advanced","category":"Estate Planning","question":"What is a step-up in basis generally associated with?","choices":["Certain inherited assets receiving a new basis at death","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":370,"difficulty":"advanced","category":"Estate Planning","question":"Why keep key documents accessible to trusted people?","choices":["They may be needed quickly during incapacity or after death","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":371,"difficulty":"advanced","category":"Planning","question":"Why run what-if scenarios in a financial plan?","choices":["They show how income, expenses, rates, or emergencies could change outcomes","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":372,"difficulty":"advanced","category":"Planning","question":"What is stress testing a plan?","choices":["Checking whether the plan can handle difficult assumptions","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":373,"difficulty":"advanced","category":"Planning","question":"Why consider after-tax return?","choices":["Taxes can change how much return you actually keep","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":374,"difficulty":"advanced","category":"Planning","question":"What is liquidity risk?","choices":["The risk of not being able to access cash when needed","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":375,"difficulty":"advanced","category":"Planning","question":"Why diversify income sources?","choices":["It can reduce reliance on one paycheck, client, or asset","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":376,"difficulty":"advanced","category":"Planning","question":"What is human capital in personal finance?","choices":["The value of future earning ability","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":377,"difficulty":"advanced","category":"Planning","question":"Why protect human capital?","choices":["Income supports saving, debt repayment, and family needs","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":378,"difficulty":"advanced","category":"Planning","question":"What is behavioral finance concerned with?","choices":["How emotions and biases affect money decisions","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":379,"difficulty":"advanced","category":"Planning","question":"Why create written investment rules?","choices":["They can reduce emotional decisions during market stress","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":380,"difficulty":"advanced","category":"Planning","question":"What is a fiduciary standard generally about?","choices":["Putting the client's interests first","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":381,"difficulty":"advanced","category":"Education Planning","question":"Why can 529 plan ownership matter?","choices":["It can affect control, financial aid treatment, and successor arrangements","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":382,"difficulty":"advanced","category":"Education Planning","question":"What is qualified education expense treatment important for?","choices":["Determining whether 529 withdrawals avoid tax and penalties","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":383,"difficulty":"advanced","category":"Education Planning","question":"Why coordinate scholarships with 529 withdrawals?","choices":["Scholarships can affect how much withdrawal is qualified","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":384,"difficulty":"advanced","category":"Education Planning","question":"What is refinancing student loans likely to change?","choices":["Rate, term, borrower protections, or federal loan benefits","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":385,"difficulty":"advanced","category":"Education Planning","question":"Why compare federal and private student loans carefully?","choices":["They can differ in repayment options and protections","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":386,"difficulty":"advanced","category":"Real Estate","question":"Why does property basis matter?","choices":["It helps calculate gain, depreciation, or loss","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":387,"difficulty":"advanced","category":"Real Estate","question":"What is escrow in a mortgage payment often used for?","choices":["Collecting money for property taxes and insurance","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":388,"difficulty":"advanced","category":"Real Estate","question":"Why can rental property losses be limited?","choices":["Passive activity rules may restrict current deductions","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":389,"difficulty":"advanced","category":"Real Estate","question":"What is a 1031 exchange generally used for?","choices":["Deferring gain on certain like-kind real estate exchanges","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":390,"difficulty":"advanced","category":"Real Estate","question":"Why distinguish repairs from improvements?","choices":["They may be deducted or capitalized differently","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":391,"difficulty":"advanced","category":"Fraud and Compliance","question":"Why freeze credit after identity theft?","choices":["It can make new credit harder to open fraudulently","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":392,"difficulty":"advanced","category":"Fraud and Compliance","question":"What is two-factor authentication useful for?","choices":["Adding another barrier beyond a password","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":393,"difficulty":"advanced","category":"Fraud and Compliance","question":"Why document conversations with lenders or tax agencies?","choices":["A written record helps track dates, names, and instructions","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":394,"difficulty":"advanced","category":"Fraud and Compliance","question":"What is a suspicious sign in an investment pitch?","choices":["A promise of high returns with no risk","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":395,"difficulty":"advanced","category":"Fraud and Compliance","question":"Why verify a charity before donating?","choices":["To confirm legitimacy and tax-deductible status if relevant","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":396,"difficulty":"advanced","category":"Advanced Tax","question":"Why can bunching charitable gifts into one year be considered?","choices":["It may help deductions exceed the standard deduction in that year","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":397,"difficulty":"advanced","category":"Advanced Tax","question":"Why can equity compensation create tax complexity?","choices":["Grant type, vesting, exercise, sale timing, and withholding can all matter","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":398,"difficulty":"advanced","category":"Planning","question":"Why can an HSA be part of long-term planning?","choices":["Eligible users may get tax advantages for qualified medical expenses","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":399,"difficulty":"advanced","category":"Self-Employment","question":"Why should a growing side business review entity and payroll choices?","choices":["Higher profit can change tax, liability, and administrative tradeoffs","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0},{"id":400,"difficulty":"advanced","category":"Investing","question":"What is tax-efficient fund placement meant to improve?","choices":["The after-tax result of holding investments across different account types","Treat the transaction as tax-free because no cash changed hands","Rely on a rule of thumb without checking eligibility limits","Ignore basis, holding period, and documentation"],"answer":0}];

  const state = {
    questions: [],
    activeDifficulty: "basic",
    deck: [],
    deckIndex: 0,
    currentQuestion: null,
    beans: 0,
    charityCounts: createEmptyCharityCounts(),
    seenThisCycle: 0,
    acceptingAnswers: false,
    nextTimer: null,
    pendingAdvance: false,
    streak: 0
  };

  const els = {
    beanCount: document.getElementById("bean-count"),
    counterRibbon: document.getElementById("counter-ribbon"),
    questionProgress: document.getElementById("question-progress"),
    category: document.getElementById("question-category"),
    deckStatus: document.getElementById("deck-status"),
    questionText: document.getElementById("question-text"),
    answers: document.getElementById("answers"),
    feedback: document.getElementById("feedback"),
    impactStage:      document.getElementById("impact-stage"),
    impactScene:      document.getElementById("impact-scene"),
    impactFill:       document.getElementById("impact-fill"),
    impactLayer:      document.getElementById("impact-layer"),
    impactDescription: document.getElementById("impact-description"),
    bowlTitle:        document.getElementById("bowl-title"),
    tierButtons:    Array.from(document.querySelectorAll("[data-difficulty]")),
    streakBadge:    document.getElementById("streak-badge"),
    streakCount:    document.getElementById("streak-count"),
    xpBar:          document.getElementById("xp-bar"),
    milestoneToast: document.getElementById("milestone-toast"),
    charityModal:   document.getElementById("charity-modal"),
    charityTag:     document.getElementById("charity-tag"),
    causeControl:   document.getElementById("cause-control"),
    changeCauseButton: document.getElementById("change-cause")
  };

  document.addEventListener("DOMContentLoaded", startApp);

  function startApp() {
    setupCharityControls();
    try {
      const saved = window.sessionStorage.getItem(CHARITY_KEY);
      if (saved && CHARITIES[saved]) {
        hideCharityPicker();
        applyCharity(saved);
        init();
      } else {
        showCharityPicker();
      }
    } catch (error) {
      init();
    }
  }

  function setupCharityControls() {
    if (els.charityModal && !els.charityModal.dataset.bound) {
      els.charityModal.querySelectorAll("[data-charity]").forEach((btn) => {
        btn.addEventListener("click", () => selectCharity(btn.dataset.charity));
      });
      els.charityModal.dataset.bound = "true";
    }
    if (els.changeCauseButton && !els.changeCauseButton.dataset.bound) {
      els.changeCauseButton.addEventListener("click", showCharityPicker);
      els.changeCauseButton.dataset.bound = "true";
    }
  }

  function showCharityPicker() {
    if (!els.charityModal) { init(); return; }
    setupCharityControls();
    els.charityModal.classList.remove("hidden", "dismissing");
    const currentBtn = els.charityModal.querySelector('[data-charity="' + currentCharityKey() + '"]');
    const firstBtn = currentBtn || els.charityModal.querySelector("[data-charity]");
    if (firstBtn) { firstBtn.focus(); }
  }

  function hideCharityPicker() {
    if (!els.charityModal) { return; }
    els.charityModal.classList.add("hidden");
    els.charityModal.classList.remove("dismissing");
  }

  function selectCharity(key) {
    if (!CHARITIES[key]) { return; }
    const previousKey = currentCharityKey();
    rememberCurrentCharityCount(previousKey);
    try { window.sessionStorage.setItem(CHARITY_KEY, key); } catch (e) {}
    state.beans = charityCountFor(key);
    applyCharity(key);
    const modal = els.charityModal;
    if (modal) {
      modal.classList.add("dismissing");
      modal.addEventListener("animationend", () => {
        modal.classList.add("hidden");
        modal.classList.remove("dismissing");
      }, { once: true });
    }
    if (state.questions.length === 0) {
      init();
    } else {
      restoreImpactUnits();
      updateStats();
      saveSession();
    }
  }

  function applyCharity(key) {
    const charity = CHARITIES[key];
    if (!charity) { return; }
    if (els.charityTag) {
      els.charityTag.innerHTML = '<span class="tag-mark tag-mark--' + key + '" aria-hidden="true"></span>Supporting: <strong>' + charity.label + '</strong>';
    }
    if (els.causeControl) {
      els.causeControl.classList.remove("hidden");
    }
    renderImpactScene(key);
    updateImpactCopy();
  }

  function currentCharityKey() {
    try {
      const saved = window.sessionStorage.getItem(CHARITY_KEY);
      return CHARITIES[saved] ? saved : "beans";
    } catch (error) {
      return "beans";
    }
  }

  function currentCharity() {
    return CHARITIES[currentCharityKey()] || CHARITIES.beans;
  }

  function createEmptyCharityCounts() {
    return Object.keys(CHARITIES).reduce((counts, key) => {
      counts[key] = 0;
      return counts;
    }, {});
  }

  function normalizeCharityCounts(savedCounts) {
    const counts = createEmptyCharityCounts();
    if (!savedCounts || typeof savedCounts !== "object") {
      return counts;
    }
    Object.keys(CHARITIES).forEach((key) => {
      counts[key] = Math.max(0, Number.parseInt(savedCounts[key], 10) || 0);
    });
    return counts;
  }

  function charityCountFor(key) {
    return Math.max(0, Number.parseInt(state.charityCounts[key], 10) || 0);
  }

  function rememberCurrentCharityCount(key = currentCharityKey()) {
    if (!CHARITIES[key]) { return; }
    state.charityCounts[key] = Math.max(0, Number.parseInt(state.beans, 10) || 0);
  }

  async function init() {
    try {
      state.questions = await loadQuestions();
      validateQuestions(state.questions);
      setupTierControls();
      renderImpactScene(currentCharityKey());
      if (restoreSession()) {
        syncTierControls();
        restoreImpactUnits();
        if (state.pendingAdvance) {
          showNextQuestion();
        } else {
          renderCurrentQuestion();
        }
      } else {
        resetDeck();
        updateStats();
        showNextQuestion();
      }
    } catch (error) {
      showLoadError(error);
    }
  }

  async function loadQuestions() {
    if (window.location.protocol === "file:") {
      return FALLBACK_QUESTIONS;
    }

    try {
      const response = await fetch(`${QUESTION_URL}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Could not load ${QUESTION_URL}`);
      }
      return response.json();
    } catch (error) {
      try {
        return await loadQuestionsFromLocalFrame();
      } catch (frameError) {
        return FALLBACK_QUESTIONS;
      }
    }
  }

  function loadQuestionsFromLocalFrame() {
    return new Promise((resolve, reject) => {
      const frame = document.createElement("iframe");
      const timeout = window.setTimeout(() => {
        frame.remove();
        reject(new Error("The question bank could not be read. Try serving the folder with a basic local server."));
      }, 2400);

      frame.hidden = true;
      frame.title = "Question bank loader";
      frame.src = QUESTION_URL;
      frame.addEventListener("load", () => {
        try {
          const text = frame.contentDocument.body.textContent.trim();
          window.clearTimeout(timeout);
          frame.remove();
          resolve(JSON.parse(text));
        } catch (error) {
          window.clearTimeout(timeout);
          frame.remove();
          reject(new Error("The browser blocked the local question bank."));
        }
      });
      frame.addEventListener("error", () => {
        window.clearTimeout(timeout);
        frame.remove();
        reject(new Error("The question bank could not be loaded."));
      });
      document.body.appendChild(frame);
    });
  }

  function validateQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("questions.json must contain an array of questions.");
    }

    questions.forEach((item, index) => {
      const hasChoices = Array.isArray(item.choices) && item.choices.length === 4;
      const hasAnswer = Number.isInteger(item.answer) && item.answer >= 0 && item.answer <= 3;
      const hasDifficulty = Object.prototype.hasOwnProperty.call(DIFFICULTIES, item.difficulty);
      if (!item.question || !hasChoices || !hasAnswer || !hasDifficulty) {
        throw new Error(`Question ${index + 1} is missing a question, difficulty, four choices, or a valid answer index.`);
      }
    });
  }

  function setupTierControls() {
    const counts = countByDifficulty();
    els.tierButtons.forEach((button) => {
      const difficulty = button.dataset.difficulty;
      const count = counts[difficulty] || 0;
      button.addEventListener("click", () => switchDifficulty(difficulty));
    });
    syncTierControls();
  }

  function switchDifficulty(difficulty) {
    if (!DIFFICULTIES[difficulty] || difficulty === state.activeDifficulty) {
      return;
    }
    if (state.nextTimer) {
      window.clearTimeout(state.nextTimer);
      state.nextTimer = null;
    }
    state.activeDifficulty = difficulty;
    state.acceptingAnswers = false;
    state.pendingAdvance = false;
    syncTierControls();
    resetDeck();
    els.feedback.textContent = `${DIFFICULTIES[difficulty]} deck selected.`;
    els.feedback.classList.remove("bad");
    showNextQuestion();
  }

  function syncTierControls() {
    els.tierButtons.forEach((button) => {
      const isActive = button.dataset.difficulty === state.activeDifficulty;
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function countByDifficulty() {
    return state.questions.reduce((memo, item) => {
      memo[item.difficulty] = (memo[item.difficulty] || 0) + 1;
      return memo;
    }, {});
  }

  function activeQuestions() {
    return state.questions.filter((question) => question.difficulty === state.activeDifficulty);
  }

  function resetDeck() {
    const active = activeQuestions();
    if (active.length === 0) {
      throw new Error(`No ${DIFFICULTIES[state.activeDifficulty]} questions found.`);
    }
    state.deck = shuffle(active);
    state.deckIndex = 0;
    state.seenThisCycle = 0;
  }

  function showNextQuestion() {
    state.pendingAdvance = false;
    if (state.deckIndex >= state.deck.length) {
      resetDeck();
      els.feedback.textContent = `Keeping the ${DIFFICULTIES[state.activeDifficulty]} questions coming!`;
    }

    const question = state.deck[state.deckIndex];
    state.deckIndex += 1;
    state.seenThisCycle += 1;
    renderQuestion(question);
    saveSession();
  }

  function renderCurrentQuestion() {
    const currentIndex = Math.max(0, Math.min(state.deckIndex - 1, state.deck.length - 1));
    renderQuestion(state.deck[currentIndex]);
  }

  function renderQuestion(question) {
    state.currentQuestion = prepareQuestion(question);
    state.acceptingAnswers = true;

    els.category.textContent = state.currentQuestion.category || "Money basics";
    els.deckStatus.textContent = DIFFICULTIES[state.activeDifficulty];
    els.questionText.textContent = state.currentQuestion.question;
    els.feedback.textContent = "";
    els.feedback.classList.remove("bad");
    els.answers.innerHTML = "";

    state.currentQuestion.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.className = "answer-button";
      button.type = "button";
      button.dataset.correct = String(choice.correct);
      button.innerHTML = `<span class="choice-key" aria-hidden="true">${LETTERS[index]}</span><span>${escapeHtml(choice.text)}</span>`;
      button.addEventListener("click", () => handleAnswer(button, choice));
      els.answers.appendChild(button);
    });

    updateStats();
  }

  function prepareQuestion(question) {
    const correctText = question.choices[question.answer];
    const choices = question.choices.map((choice, index) => ({
      text: choice,
      correct: index === question.answer
    }));

    return {
      category: question.category,
      question: question.question,
      correctText,
      choices: shuffle(choices)
    };
  }

  function handleAnswer(button, choice) {
    if (!state.acceptingAnswers) {
      return;
    }

    state.acceptingAnswers = false;
    Array.from(els.answers.children).forEach((answerButton) => {
      answerButton.disabled = true;
      if (answerButton.dataset.correct === "true") {
        answerButton.classList.add("correct");
      }
    });

    if (choice.correct) {
      state.beans += 1;
      rememberCurrentCharityCount();
      state.streak += 1;
      state.pendingAdvance = true;
      button.classList.add("correct");
      els.feedback.textContent = state.streak >= 3
        ? `${impactAwardText()} - ${state.streak} in a row!`
        : impactAwardText();
      els.feedback.classList.remove("bad");
      addImpactUnit();
      updateStats();
      updateStreak();
      logImpactEvent();
      if (MILESTONES[state.beans]) {
        showMilestoneToast(MILESTONES[state.beans]);
      }
      saveSession();
      state.nextTimer = window.setTimeout(showNextQuestion, NEXT_DELAY_CORRECT);
    } else {
      state.streak = 0;
      state.pendingAdvance = true;
      button.classList.add("wrong");
      els.feedback.textContent = `Good try. The correct answer is: ${state.currentQuestion.correctText}`;
      els.feedback.classList.add("bad");
      updateStreak();
      saveSession();
      state.nextTimer = window.setTimeout(showNextQuestion, NEXT_DELAY_WRONG);
    }
  }

  function renderImpactScene(key = currentCharityKey()) {
    const charity = CHARITIES[key] || CHARITIES.beans;
    if (!els.impactStage || !els.impactScene) { return; }

    els.impactStage.dataset.charity = key;
    els.impactStage.classList.remove("impact-stage--rice", "impact-stage--beans", "impact-stage--kibble", "impact-stage--ocean", "impact-stage--trees");
    els.impactStage.classList.add("impact-stage--" + key);

    if (charity.scene === "trees") {
      els.impactScene.innerHTML = '<div class="tree-scene"><div class="tree-sky"></div><div class="tree-grove" id="completed-trees"></div><div class="current-tree" id="current-tree"><span class="tree-trunk"></span><span class="tree-leaf tree-leaf--left"></span><span class="tree-leaf tree-leaf--right"></span><span class="tree-leaf tree-leaf--top"></span></div><div class="soil-bed"><span></span></div></div>';
    } else if (charity.scene === "ocean") {
      els.impactScene.innerHTML = '<div class="ocean-scene"><div class="ocean-sky"></div><div class="ocean-water"></div><div class="shoreline"></div><div class="mesh-bag"><div class="mesh-bag-mouth"></div><div class="mesh-weave"></div><div class="impact-layer" id="impact-layer"></div></div></div>';
    } else {
      const bowlClass = charity.scene === "kibble" ? "realistic-bowl realistic-bowl--dog" : "realistic-bowl realistic-bowl--ceramic";
      els.impactScene.innerHTML = '<div class="bowl-wrap impact-bowl-wrap"><div class="impact-fill" id="impact-fill"></div><div class="impact-layer" id="impact-layer"></div><div class="bowl-gloss"></div><div class="' + bowlClass + '"></div></div>';
    }

    els.impactFill = document.getElementById("impact-fill");
    els.impactLayer = document.getElementById("impact-layer");
    restoreImpactUnits();
  }

  function addImpactUnit(count = state.beans, animate = true) {
    const charity = currentCharity();
    if (charity.scene === "trees") {
      renderTreeProgress();
      return;
    }

    const totalUnits = Math.min(count * charity.perAnswer, charity.cap);
    const previousUnits = Math.max(0, Math.min((count - 1) * charity.perAnswer, charity.cap));
    for (let unit = previousUnits + 1; unit <= totalUnits; unit += 1) {
      appendImpactPiece(charity, unit, animate);
    }
    updateImpactFill(charity, totalUnits);
  }

  function restoreImpactUnits() {
    const charity = currentCharity();
    if (!els.impactScene) { return; }
    if (charity.scene === "trees") {
      renderTreeProgress();
      return;
    }
    if (!els.impactLayer) { return; }
    els.impactLayer.innerHTML = "";
    const totalUnits = Math.min(state.beans * charity.perAnswer, charity.cap);
    for (let unit = 1; unit <= totalUnits; unit += 1) {
      appendImpactPiece(charity, unit, false);
    }
    updateImpactFill(charity, totalUnits);
  }

  function appendImpactPiece(charity, unit, animate) {
    if (!els.impactLayer) { return; }
    const piece = document.createElement("span");
    piece.className = impactPieceClass(charity, unit) + (animate ? "" : " settled");
    const position = impactPosition(charity, unit);
    piece.style.left = position.x + "%";
    piece.style.bottom = position.y + "%";
    piece.style.setProperty("--r", position.r + "deg");
    piece.style.setProperty("--s", position.s);
    piece.style.setProperty("--d", (unit % 10) * 22 + "ms");
    els.impactLayer.appendChild(piece);
  }

  function impactPieceClass(charity, unit) {
    if (charity.scene === "rice") return "impact-piece rice-grain";
    if (charity.scene === "kibble") return "impact-piece kibble-piece kibble-piece--" + ((unit % 4) + 1);
    if (charity.scene === "ocean") {
      const types = ["straw", "bag", "wrapper", "cap", "bottle"];
      return "impact-piece plastic-piece plastic-piece--" + types[unit % types.length];
    }
    return "impact-piece bean-piece bean-piece--" + ((unit % 3) + 1);
  }

  function impactPosition(charity, unit) {
    if (charity.scene === "rice") {
      const row = Math.floor((unit - 1) / 24);
      const slot = (unit - 1) % 24;
      return {
        x: 7 + slot * 3.7 + randomBetween(-1.1, 1.1),
        y: Math.min(5 + row * 2.8 + randomBetween(-0.7, 0.7), 58),
        r: randomBetween(-42, 42),
        s: randomBetween(0.75, 1.1).toFixed(2)
      };
    }
    if (charity.scene === "ocean") {
      const row = Math.floor((unit - 1) / 9);
      const slot = (unit - 1) % 9;
      return {
        x: 17 + slot * 7.5 + randomBetween(-2.4, 2.4),
        y: Math.min(8 + row * 5.2 + randomBetween(-1.3, 1.3), 64),
        r: randomBetween(-34, 34),
        s: randomBetween(0.82, 1.16).toFixed(2)
      };
    }
    const row = Math.floor((unit - 1) / 10);
    const slot = (unit - 1) % 10;
    return {
      x: 8 + slot * 8.6 + randomBetween(-2.6, 2.6),
      y: Math.min(7 + row * 4.7 + randomBetween(-1, 1), 66),
      r: randomBetween(-34, 34),
      s: randomBetween(0.88, 1.14).toFixed(2)
    };
  }

  function updateImpactFill(charity, totalUnits) {
    if (!els.impactFill) { return; }
    const fill = Math.min(100, Math.round((totalUnits / charity.cap) * 100));
    els.impactFill.style.setProperty("--fill", fill + "%");
  }

  function renderTreeProgress() {
    const grove = document.getElementById("completed-trees");
    const currentTree = document.getElementById("current-tree");
    if (!grove || !currentTree) { return; }
    const planted = Math.floor(state.beans / 100);
    const growth = state.beans % 100;
    const growthRatio = growth === 0 ? 0.06 : 0.06 + (growth / 99) * 0.94;
    currentTree.style.setProperty("--growth", growthRatio.toFixed(3));
    grove.innerHTML = "";
    const visibleTrees = Math.min(planted, 5);
    for (let index = 0; index < visibleTrees; index += 1) {
      const tree = document.createElement("span");
      tree.className = "completed-tree completed-tree--" + ((index % 3) + 1);
      tree.style.left = (13 + index * 16) + "%";
      grove.appendChild(tree);
    }
    if (planted > 5) {
      const more = document.createElement("span");
      more.className = "tree-count-marker";
      more.textContent = "+" + (planted - 5);
      grove.appendChild(more);
    }
  }

  function updateStats() {
    const prev = Number(els.beanCount.textContent) || 0;
    els.beanCount.textContent = state.beans;
    if (state.beans > prev) {
      els.beanCount.classList.remove("pulse");
      void els.beanCount.offsetWidth;
      els.beanCount.classList.add("pulse");
    }
    updateImpactCopy();
    if (els.questionProgress) { els.questionProgress.textContent = String(state.seenThisCycle); }
    if (els.xpBar) {
      const total = state.deck.length || activeQuestions().length || 1;
      const pct = Math.min(100, Math.round((state.seenThisCycle / total) * 100));
      els.xpBar.style.width = `${pct}%`;
    }
  }

  function updateStreak() {
    if (!els.streakBadge || !els.streakCount) { return; }
    if (state.streak >= 3) {
      els.streakCount.textContent = state.streak;
      els.streakBadge.classList.remove("hidden");
    } else {
      els.streakBadge.classList.add("hidden");
    }
  }

  function logImpactEvent() {
    try {
      const charityKey = currentCharityKey();
      const charity = currentCharity();
      const timestamp = new Date();
      const events = JSON.parse(window.localStorage.getItem(IMPACT_EVENTS_KEY) || "[]");
      const event = {
        id: "impact-" + timestamp.getTime() + "-" + Math.random().toString(36).slice(2, 8),
        timestamp: timestamp.toISOString(),
        day: formatLocalDate(timestamp),
        cause: charityKey,
        causeLabel: charity.label,
        correctAnswers: 1,
        units: charity.perAnswer,
        unit: charity.unit,
        unitPlural: charity.unitPlural,
        treesPlanted: charity.scene === "trees" && state.beans % 100 === 0 ? 1 : 0
      };
      events.push(event);
      window.localStorage.setItem(IMPACT_EVENTS_KEY, JSON.stringify(events));
      if (db) {
        db.from("quiz_events").insert({
          id:            event.id,
          timestamp_iso: event.timestamp,
          day:           event.day,
          cause:         event.cause,
          correct_answers: event.correctAnswers,
          units:         event.units,
          trees_planted: event.treesPlanted
        }).then(function () {});
      }
    } catch (error) {
      // Local impact reporting is optional; the quiz should still work if storage is blocked.
    }
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  let milestoneTimer = null;
  function showMilestoneToast(message) {
    if (!els.milestoneToast) { return; }
    if (milestoneTimer) {
      window.clearTimeout(milestoneTimer);
      els.milestoneToast.classList.remove("show");
    }
    els.milestoneToast.textContent = message;
    void els.milestoneToast.offsetWidth;
    els.milestoneToast.classList.add("show");
    milestoneTimer = window.setTimeout(() => {
      els.milestoneToast.classList.remove("show");
      milestoneTimer = null;
    }, 3200);
  }

  function saveSession() {
    try {
      rememberCurrentCharityCount();
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        bankSize: state.questions.length,
        activeDifficulty: state.activeDifficulty,
        deckIds: state.deck.map((question) => question.id),
        deckIndex: state.deckIndex,
        seenThisCycle: state.seenThisCycle,
        beans: state.beans,
        charityCounts: state.charityCounts,
        pendingAdvance: state.pendingAdvance
      }));
    } catch (error) {
      // Browsers can block storage in strict privacy modes; the quiz still works in memory.
    }
  }

  function restoreSession() {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || saved.bankSize !== state.questions.length || !DIFFICULTIES[saved.activeDifficulty]) {
        return false;
      }

      const questionsById = new Map(state.questions.map((question) => [question.id, question]));
      const restoredDeck = saved.deckIds.map((id) => questionsById.get(id));
      const hasValidDeck = restoredDeck.length > 0 && restoredDeck.every((question) => question && question.difficulty === saved.activeDifficulty);
      if (!hasValidDeck) {
        return false;
      }

      state.activeDifficulty = saved.activeDifficulty;
      state.deck = restoredDeck;
      state.deckIndex = clampNumber(saved.deckIndex, 1, restoredDeck.length);
      state.seenThisCycle = clampNumber(saved.seenThisCycle, 1, restoredDeck.length);
      state.charityCounts = normalizeCharityCounts(saved.charityCounts);
      if (!saved.charityCounts) {
        state.charityCounts[currentCharityKey()] = Math.max(0, Number.parseInt(saved.beans, 10) || 0);
      }
      state.beans = charityCountFor(currentCharityKey());
      state.pendingAdvance = Boolean(saved.pendingAdvance);
      return true;
    } catch (error) {
      return false;
    }
  }

  function clampNumber(value, min, max) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) {
      return min;
    }
    return Math.min(Math.max(number, min), max);
  }

  function updateImpactCopy() {
    const charity = currentCharity();
    const totalUnits = state.beans * charity.perAnswer;
    const label = totalUnits === 1 ? charity.unit : charity.unitPlural;
    if (els.counterRibbon) {
      if (charity.scene === "trees") {
        const planted = Math.floor(state.beans / 100);
        const progress = state.beans % 100;
        els.counterRibbon.textContent = planted + " " + (planted === 1 ? "tree" : "trees") + " planted - " + progress + "/100 toward the next tree";
      } else {
        els.counterRibbon.textContent = state.beans === 0
          ? "0 correct answers for " + charity.label
          : "You've added " + totalUnits + " " + label + "!";
      }
    }
    if (els.bowlTitle) {
      els.bowlTitle.textContent = state.beans === 0 ? charity.emptyTitle : charity.activeTitle;
    }
    if (els.impactDescription) {
      if (charity.scene === "trees") {
        const planted = Math.floor(state.beans / 100);
        els.impactDescription.textContent = charity.description + " Trees planted this session: " + planted + ".";
      } else {
        els.impactDescription.textContent = charity.description;
      }
    }
  }

  function impactAwardText() {
    const charity = currentCharity();
    if (charity.scene === "trees") {
      const progress = state.beans % 100;
      return progress === 0 ? "Nice! A tree was planted." : "Nice! The seedling grew.";
    }
    const amount = charity.perAnswer;
    return "Nice! +" + amount + " " + (amount === 1 ? charity.unit : charity.unitPlural);
  }

  function shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showLoadError(error) {
    els.category.textContent = "Question bank";
    els.deckStatus.textContent = "Needs attention";
    els.questionText.textContent = "The quiz could not load its questions.";
    els.answers.innerHTML = "";
    els.feedback.textContent = error.message;
    els.feedback.classList.add("bad");
  }
})();
