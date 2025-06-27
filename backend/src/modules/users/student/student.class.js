const classService = require("../../classes/class.service");
const wishlistService = require("../../classes/wishlist/classWishlist.service");
const cartService = require("../../cart/cart.service");
const enrollmentService = require("../../classes/enrollments/classEnrollment.service");
const paymentsService = require("../../payments/payments.service");
const { v4: uuidv4 } = require("uuid");

class Student {
  constructor(userId) {
    this.userId = userId;
  }

  async discoverClasses() {
    return classService.getPublishedClasses();
  }

  async viewClassDetails(classId) {
    return classService.getPublicClassDetails(classId);
  }

  async addToWishlist(classId) {
    return wishlistService.add(this.userId, classId);
  }

  async removeFromWishlist(classId) {
    return wishlistService.remove(this.userId, classId);
  }

  async listWishlist() {
    return wishlistService.listByUser(this.userId);
  }

  addToCart(classId, quantity = 1) {
    return cartService.add({ id: classId, quantity });
  }

  viewCart() {
    return cartService.list();
  }

  removeFromCart(classId) {
    return cartService.remove(classId);
  }

  async listEnrolledClasses() {
    return enrollmentService.getByUser(this.userId);
  }

  async checkout(paymentMethodId) {
    const cartItems = cartService.list();
    const results = [];
    for (const item of cartItems) {
      const cls = await classService.getClassById(item.id);
      if (!cls) continue;
      const enrollment = await enrollmentService.createEnrollment({
        id: uuidv4(),
        user_id: this.userId,
        class_id: item.id,
        status: "enrolled",
      });
      const payment = await paymentsService.create({
        user_id: this.userId,
        method_id: paymentMethodId,
        item_type: "class",
        item_id: item.id,
        amount: cls.price || 0,
        status: "paid",
        paid_at: new Date(),
      });
      cartService.remove(item.id);
      results.push({ enrollment, payment });
    }
    return results;
  }
}

module.exports = Student;
