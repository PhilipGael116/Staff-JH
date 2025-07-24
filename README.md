# Staff-JH
A system built for Users to register and manage Invoices associated with customers

#User Flow

[Start] --> [Login Page]
   |
   v
[Authenticate User]
   |--(Fail)--> [Show Error Message] --> [Login Page]
   |
   |--(Success)-->
   v
[Dashboard]
   |
   |--> [View Services]
   |
   |--> [View Products] --> [View Product Details] --> [Add/Edit/Delete Product]
   |
   |--> [View Customers] --> [View Customer Details] --> [Add/Edit Customer]
   |
   |--> [Create Invoice] --> [Select Customer] --> [Add Products & Quantity] --> [Set Payment Status] --> [Save Invoice]
   |
   |--> [View Invoices] --> [View Invoice Details] --> [Update Payment Status]
   |
   |--> [Logout] --> [Login Page]

