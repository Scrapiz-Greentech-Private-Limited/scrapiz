from django.urls import path
from .views.user import  RegisterView, LoginView, LogoutView, PasswordResetView, PasswordResetRequestView, ResendotpView, UserView,ReferredUsersView , ReferralTransactionsView,RedeemReferralBalanceView
from .views.oauth import GoogleOAuthLoginView

urlpatterns = [
    path('register/',RegisterView.as_view()),
    path('resendotp/',ResendotpView.as_view()),
    path('login/',LoginView.as_view()),
    path('user/',UserView.as_view()),
    path('logout/',LogoutView.as_view()),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('google-login/', GoogleOAuthLoginView.as_view(), name='google-login'),
    path('referrals/users/', ReferredUsersView.as_view(), name='referred-users'),
    path('referrals/transactions/', ReferralTransactionsView.as_view(), name='referral-transactions'),
    path('referrals/redeem/', RedeemReferralBalanceView.as_view(), name='redeem-referral-balance'),
]
