const classService = require("../../classes/class.service");
const wishlistService = require("../../classes/wishlist/classWishlist.service");
const cartService = require("../../cart/cart.service");
const enrollmentService = require("../../classes/enrollments/classEnrollment.service");
const paymentsService = require("../../payments/payments.service");
const paymentMethodsService = require("../../paymentMethods/paymentMethods.service");
const db = require("../../../config/database");
const { v4: uuidv4 } = require("uuid");

class Student {
  constructor(userId) {
    this.userId = userId;
  }

  async discoverClasses(page = 1, limit = 10) {
    const result = await classService.getPublishedClasses({ page, limit });
    return result.data;
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

  addToCart(classId, price = 0, quantity = 1) {
    return cartService.add(this.userId, {
      id: classId,
      quantity,
      item_type: "class",
      price,
    });
  }

  viewCart() {
    return cartService.list(this.userId);
  }

  removeFromCart(classId) {
    return cartService.remove(this.userId, classId);
  }

  async listEnrolledClasses() {
    return enrollmentService.getByUser(this.userId);
  }

  async checkout(paymentMethodId) {
    const cartItems = await cartService.list(this.userId);
    const method = await paymentMethodsService.getById(paymentMethodId);
    const status =
      method && method.type === "bank"
        ? paymentsService.STATUS.AWAITING_APPROVAL
        : paymentsService.STATUS.PENDING_PAYMENT;

    return db.transaction(async (trx) => {
      const results = [];
      const processedIds = [];

      for (const item of cartItems) {
        if (item.item_type !== "class") {
          throw new Error("Invalid cart item type");
        }

        const cls = await trx("online_classes").where({ id: item.id }).first();
        if (!cls) {
          throw new Error("Class not found");
        }

        const [enrollment] = await trx("class_enrollments")
          .insert({
            id: uuidv4(),
            user_id: this.userId,
            class_id: item.id,
            status: "enrolled",
          })
          .returning("*");

        const payment = await paymentsService.create(
          {
            user_id: this.userId,
            method_id: paymentMethodId,
            item_type: item.item_type,
            item_id: item.id,
            amount: item.price || 0,
            status: item.price > 0 ? status : paymentsService.STATUS.PAID,
          },
          [],
          trx
        );

        processedIds.push(item.id);
        results.push({ enrollment, payment });
      }

      if (processedIds.length) {
        await trx("cart_items")
          .where({ user_id: this.userId })
          .whereIn("item_id", processedIds)
          .del();
      }

      return results;
    });
  }
}

module.exports = Student;
